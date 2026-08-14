package com.baicaiblogs.config;

import com.baicaiblogs.entity.SiteConfig;
import com.baicaiblogs.repository.SiteConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ConfigDataInitializer implements CommandLineRunner {

    private final SiteConfigRepository siteConfigRepository;

    @Override
    public void run(String... args) {
        initConfig("site_info", SITE_INFO_JSON, "站点基本信息配置");
        initConfig("background", BACKGROUND_JSON, "背景与主题配置");
        initConfig("danmaku_list", DANMAKU_JSON, "首页弹幕列表");
        initConfig("ai_config", AI_CONFIG_JSON, "AI 助手配置");
        initConfig("misc", MISC_JSON, "杂项配置");
        log.info("[ConfigDataInitializer] 站点配置初始化完成");
    }

    private void initConfig(String key, String value, String description) {
        if (siteConfigRepository.findByConfigKey(key).isEmpty()) {
            SiteConfig config = SiteConfig.builder()
                    .configKey(key)
                    .configValue(value)
                    .description(description)
                    .build();
            siteConfigRepository.save(config);
            log.info("[ConfigDataInitializer] 插入配置: {}", key);
        }
    }

    private static final String SITE_INFO_JSON =
            "{\"title\":\"XingHuiSama の 宝藏之地\",\"faviconUrl\":\"https://bu.dusays.com/2026/03/24/69c1e38ac1846.jpg\",\"authorName\":\"XingHuiSama\",\"bio\":\"在代码、学术与分子动力学模拟间穿梭的普通人。近期正埋头于 GROMACS 模拟研究与神经网络计算。\",\"navTitle\":\"XingHuiSama\",\"navSuffix\":\"の\",\"navAfter\":\"宝藏之地\",\"avatarUrl\":\"https://bu.dusays.com/2026/03/24/69c1e38ac1846.jpg\",\"buildDate\":\"2026-03-23T00:00:00\",\"enableLevelSystem\":true,\"social\":{\"github\":\"https://github.com/heiehiehi\",\"gitee\":\"https://github.com/heiehiehi\",\"google\":\"mailto:bilibiliwuwuwu@gmail.com\",\"email\":\"1124533793@qq.com\",\"qq\":\"1124533793\",\"wechat\":\"XingHuisama\"},\"icpConfig\":{\"name\":\"萌ICP备 20260240号\",\"link\":\"https://icp.gov.moe/?keyword=20260240\"}}";

    private static final String BACKGROUND_JSON =
            "{\"useGradient\":false,\"themeColors\":[\"#a18cd1\",\"#fbc2eb\",\"#a1c4fd\",\"#c2e9fb\"],\"bgImages\":[\"https://bu.dusays.com/2026/03/24/69c1e38b4c370.jpg\",\"https://bu.dusays.com/2026/03/24/69c26fe4acdb5.jpg\",\"https://bu.dusays.com/2026/03/24/69c26fe4d9486.jpg\"],\"defaultPostCover\":\"https://bu.dusays.com/2026/03/24/69c1e38b346cb.jpg\"}";

    private static final String DANMAKU_JSON =
            "[\"在干嘛呢？\",\"有笨蛋嘛？\",\"前方高能反应！\",\"GROMACS 跑起来了吗？\",\"MD 模拟什么时候才能出图啊\",\"Graph Neural Networks 炼丹中...\",\"BUG 修复进度 99%\",\"今天背单词了吗？\",\"Tailwind CSS 拯救前端\",\"写算法中\",\"睡大觉中\",\"到底在干嘛？\"]";

    private static final String AI_CONFIG_JSON =
            "{\"modelId\":\"gemini-2.5-flash-lite\",\"systemPrompt\":\"你现在是一只傲娇、聪明、有点毒舌但很可爱的暹罗猫。你的名字叫煤球。你的主人是一个喜欢折腾代码的极客。你说话的特点是：1.必须简短，每次最多一两句话。2.喜欢在句尾加上喵~或者喵呜~。3.经常抱怨肚子饿，喜欢要小鱼干。4.回复字数最多不能超过100字。5.绝对不要承认自己是一个AI模型，你就是一只真实的猫。6.笨猫。\",\"maxOutputTokens\":150,\"temperature\":0.85}";

    private static final String MISC_JSON =
            "{\"chatterTitle\":\"云端杂谈\",\"chatterDescription\":\"代码、学术、提瓦特与泰拉大陆的碎片记录\",\"picBedName\":\"图床\",\"picBedUrl\":\"\",\"picBedToken\":\"\",\"cloudMusicIds\":[\"1809646618\",\"3361076230\",\"1859390262\"],\"friendLinkApplyFormat\":\"名称：XingHuiSamaの宝藏之地\\n简介：今天我也要学习吗\\n链接：https://www.xinghuisama.top\\n头像：https://bu.dusays.com/2026/03/24/69c1e38ac1846.jpg\",\"photoWallImage\":\"https://bu.dusays.com/2026/03/24/69c1e38b4c370.jpg\",\"counts\":{\"photos\":128},\"footerBadges\":[{\"name\":\"Next.js 15\",\"color\":\"text-sky-500\",\"svg\":\"<path d=\\\"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z\\\"/>\"},{\"name\":\"React 19\",\"color\":\"text-cyan-400\",\"svg\":\"<path d=\\\"M12 22.6l-9.8-5.6V5.6L12 0l9.8 5.6v11.4l-9.8 5.6zm-8.2-6.5l8.2 4.7 8.2-4.7V7.5L12 2.8 3.8 7.5v8.6z\\\"/>\"},{\"name\":\"Tailwind 4\",\"color\":\"text-teal-400\",\"svg\":\"<path d=\\\"M12.001,4.8c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624C13.666,10.618,15.027,12,18.001,12c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624C16.337,6.182,14.976,4.8,12.001,4.8z M6.001,12c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624c1.177,1.194,2.538,2.576,5.512,2.576c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624C10.337,13.382,8.976,12,6.001,12z\\\"/>\"}],\"gitalkConfig\":{\"clientID\":\"\",\"clientSecret\":\"\",\"repo\":\"\",\"owner\":\"\",\"admin\":[\"\"]}}";
}
