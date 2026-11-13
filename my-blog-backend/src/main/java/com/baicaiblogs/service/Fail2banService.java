package com.baicaiblogs.service;

import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.InetAddress;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.regex.Pattern;

@Service
public class Fail2banService {

    private static final Set<String> JAILS = Set.of("baicai-scan", "baicai-limit", "ufw-scan", "sshd");
    private static final String WRAPPER = "/usr/local/sbin/baicai-fail2ban";
    private static final Pattern IPV4 = Pattern.compile(
            "^((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)\\.){3}(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)$");

    public List<Map<String, Object>> list() {
        List<Map<String, Object>> result = new ArrayList<>();
        for (String jail : JAILS) {
            String output = run("fail2ban-client", "status", jail);
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
        String output = run("fail2ban-client", "set", jail, "unbanip", ip);
        if (output == null) throw new RuntimeException("fail2ban 解封失败");
    }

    private boolean isValidIp(String ip) {
        try {
            if (ip.contains(":") ) {
                InetAddress address = InetAddress.getByName(ip);
                return address instanceof java.net.Inet6Address;
            }
            return IPV4.matcher(ip).matches() && InetAddress.getByName(ip) != null;
        } catch (Exception e) {
            return false;
        }
    }

    private String run(String... command) {
        try {
            String[] full = new String[command.length + 3];
            full[0] = "sudo";
            full[1] = "-n";
            full[2] = WRAPPER;
            System.arraycopy(command, 0, full, 3, command.length);
            Process process = new ProcessBuilder(full).redirectErrorStream(true).start();
            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) output.append(line).append('\n');
            }
            if (!process.waitFor(5, TimeUnit.SECONDS)) {
                process.destroyForcibly();
                return null;
            }
            return process.exitValue() == 0 ? output.toString() : null;
        } catch (Exception e) {
            return null;
        }
    }
}
