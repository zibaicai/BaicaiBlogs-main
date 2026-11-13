package com.baicaiblogs.service;

import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.net.InetAddress;
import java.net.StandardProtocolFamily;
import java.net.UnixDomainSocketAddress;
import java.nio.ByteBuffer;
import java.nio.channels.SocketChannel;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

@Service
public class Fail2banService {

    private static final Set<String> JAILS = Set.of("baicai-scan", "baicai-limit", "ufw-scan", "sshd");
    private static final String AGENT_SOCKET = "/run/baicai-fail2ban/agent.sock";
    private static final Pattern IPV4 = Pattern.compile(
            "^((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)\\.){3}(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)$");

    public List<Map<String, Object>> list() {
        List<Map<String, Object>> result = new ArrayList<>();
        for (String jail : JAILS) {
            String output = run("status", jail);
            if (output == null) continue;
            for (String line : output.split("\\R")) {
                int marker = line.indexOf("Banned IP list:");
                if (marker < 0) continue;
                String value = line.substring(marker + "Banned IP list:".length()).trim();
                if (value.isEmpty()) continue;
                for (String ip : value.split("\\s+")) {
                    if (isValidIp(ip)) {
                        result.add(Map.of("jail", jail, "ip", ip, "source", "FAIL2BAN"));
                    }
                }
            }
        }
        return result;
    }

    public void unban(String jail, String ip) {
        if (!JAILS.contains(jail)) throw new RuntimeException("不支持的封禁来源");
        if (!isValidIp(ip)) throw new RuntimeException("IP 格式不正确");
        String output = run("unban", jail, ip);
        if (output == null) throw new RuntimeException("fail2ban 解封失败");
    }

    private boolean isValidIp(String ip) {
        try {
            if (ip.contains(":")) {
                InetAddress address = InetAddress.getByName(ip);
                return address instanceof java.net.Inet6Address;
            }
            return IPV4.matcher(ip).matches() && InetAddress.getByName(ip) != null;
        } catch (Exception e) {
            return false;
        }
    }

    private String run(String... args) {
        try (SocketChannel channel = SocketChannel.open(StandardProtocolFamily.UNIX)) {
            channel.connect(UnixDomainSocketAddress.of(AGENT_SOCKET));
            String request = String.join(" ", args) + "\n";
            channel.write(ByteBuffer.wrap(request.getBytes(StandardCharsets.UTF_8)));
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            ByteBuffer buffer = ByteBuffer.allocate(4096);
            while (channel.read(buffer) >= 0) {
                buffer.flip();
                byte[] chunk = new byte[buffer.remaining()];
                buffer.get(chunk);
                out.write(chunk);
                buffer.clear();
            }
            String response = out.toString(StandardCharsets.UTF_8);
            if (!response.startsWith("OK\n")) return null;
            return response.substring(3);
        } catch (Exception e) {
            return null;
        }
    }
}
