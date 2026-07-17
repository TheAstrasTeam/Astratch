// 关于本地的实用工具

const ALL_PLATFORMS = {
    WIN: 'windows',
    MAC: 'macos',
    LINUX: 'linux',
};

type TAll_Platforms = (typeof ALL_PLATFORMS)[keyof typeof ALL_PLATFORMS];

const getPlatfrom = (): TAll_Platforms => {
    // @ts-expect-error 这玩意类型注解不包含
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const platform = navigator.userAgentData.platform as string;
    if (platform) {
        switch (platform) {
            case 'Windows':
                return ALL_PLATFORMS.WIN;
            case 'macOS':
                return ALL_PLATFORMS.MAC;
            default:
                return ALL_PLATFORMS.LINUX;
        }
    } else {
        const navigatorPlatform = navigator.platform;
        switch (navigatorPlatform) {
            case 'Win64':
            case 'Win32':
                return ALL_PLATFORMS.WIN;
            case 'MacIntel':
                return ALL_PLATFORMS.MAC;
            default:
                return ALL_PLATFORMS.LINUX;
        }
    }
};

export {
    getPlatfrom,
    ALL_PLATFORMS,
    type TAll_Platforms
}