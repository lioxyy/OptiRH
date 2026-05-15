import { contextBridge } from 'electron';

// Minimal stub for Phase 0
contextBridge.exposeInMainWorld('electronAPI', {
    backendPort: '3001',
});
