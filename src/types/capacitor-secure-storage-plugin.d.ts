declare module 'capacitor-secure-storage-plugin' {
  export const SecureStoragePlugin: {
    get(options: { key: string }): Promise<{ value: string }>;
    set(options: { key: string; value: string }): Promise<{ value: boolean }>;
    remove(options: { key: string }): Promise<{ value: boolean }>;
    clear(): Promise<{ value: boolean }>;
    keys(): Promise<{ value: string[] }>;
  };
}
