// VM
export interface IFSettings {
    enableTurboMode: boolean
}

export interface IFRuntime {
    projectID: string,
    projectAdult: string[],
}

export interface IFVM {
    Runtime: IFRuntime
    Settings: IFSettings
    editingTargetID: string
}

// settings
export interface settings {
    userName: string,
    guiTheme: 'dark' | 'light'
}