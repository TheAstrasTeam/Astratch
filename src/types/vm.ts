export interface IVMSettings {
    enableTurboMode: boolean
}

export interface IRuntime {
    projectID: string
    projectAdult: string[]
}

export interface IProjectManager {
    folderHandle?: FileSystemDirectoryHandle,
    isAPIAvailable: boolean,
    selectFolder: () => Promise<void>
}

export interface IVM {
    Runtime: IRuntime
    Settings: IVMSettings
    editingTargetID: string
    ProjectManager: IProjectManager
    selectProject: () => Promise<void>
}
