const getBlocklyI18nByI18next = (id: string) => {
    switch (id) {
        case 'zh-CN':
            return 'zh-Hans';
        case 'en':
            return 'en';
        default:
            return 'en';
    }
};

export { getBlocklyI18nByI18next };
