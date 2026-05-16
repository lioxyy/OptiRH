import { Minus, Square, X, Monitor } from "lucide-react"

import {
    Menubar,
    MenubarContent,
    MenubarItem,
    MenubarMenu,
    MenubarSeparator,
    MenubarShortcut,
    MenubarTrigger,
} from "@/components/ui/menubar"

export function TitleBar() {
    const minimize = () => (window as any).electronAPI?.minimize()
    const maximize = () => (window as any).electronAPI?.maximize()
    const close = () => (window as any).electronAPI?.close()

    const zoomIn = () => (window as any).electronAPI?.zoomIn()
    const zoomOut = () => (window as any).electronAPI?.zoomOut()
    const zoomReset = () => (window as any).electronAPI?.zoomReset()

    return (
        <div
            className="flex h-9 shrink-0 items-center justify-between border-b border-sidebar-border bg-[#18181a] px-2 select-none"
            style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
            <div
                className="flex items-center gap-2"
                style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            >
                <div className="flex items-center gap-2 pl-1 pr-3">
                    <Monitor className="h-4 w-4 text-sidebar-foreground/60" />
                    <span className="text-[11px] font-medium text-sidebar-foreground/40 uppercase tracking-wider">OptiRH</span>
                </div>
                <Menubar className="border-none bg-transparent h-8 p-0 shadow-none gap-0.5">
                    <MenubarMenu>
                        <MenubarTrigger className="h-7 cursor-pointer px-3 text-[13px] font-normal hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground text-sidebar-foreground transition-none rounded-sm translate-y-[0.5px]">File</MenubarTrigger>
                        <MenubarContent className="border-sidebar-border bg-[#1c1c1e] text-sidebar-foreground min-w-[200px] shadow-2xl p-1">
                            <MenubarItem className="px-3 py-1.5 focus:bg-primary focus:text-primary-foreground rounded-sm">
                                New Window <MenubarShortcut className="ml-auto opacity-50">Ctrl+N</MenubarShortcut>
                            </MenubarItem>
                            <MenubarSeparator className="bg-sidebar-border my-1 mx-1" />
                            <MenubarItem onClick={close} className="px-3 py-1.5 focus:bg-destructive focus:text-destructive-foreground rounded-sm">
                                Exit <MenubarShortcut className="ml-auto opacity-50">Alt+F4</MenubarShortcut>
                            </MenubarItem>
                        </MenubarContent>
                    </MenubarMenu>

                    <MenubarMenu>
                        <MenubarTrigger className="h-7 cursor-pointer px-3 text-[13px] font-normal hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground text-sidebar-foreground transition-none rounded-sm translate-y-[0.5px]">Edit</MenubarTrigger>
                        <MenubarContent className="border-sidebar-border bg-[#1c1c1e] text-sidebar-foreground min-w-[200px] shadow-2xl p-1">
                            <MenubarItem className="px-3 py-1.5 focus:bg-primary focus:text-primary-foreground rounded-sm">Undo <MenubarShortcut className="ml-auto opacity-50">Ctrl+Z</MenubarShortcut></MenubarItem>
                            <MenubarItem className="px-3 py-1.5 focus:bg-primary focus:text-primary-foreground rounded-sm">Redo <MenubarShortcut className="ml-auto opacity-50">Ctrl+Y</MenubarShortcut></MenubarItem>
                            <MenubarSeparator className="bg-sidebar-border my-1 mx-1" />
                            <MenubarItem className="px-3 py-1.5 focus:bg-primary focus:text-primary-foreground rounded-sm">Cut <MenubarShortcut className="ml-auto opacity-50">Ctrl+X</MenubarShortcut></MenubarItem>
                            <MenubarItem className="px-3 py-1.5 focus:bg-primary focus:text-primary-foreground rounded-sm">Copy <MenubarShortcut className="ml-auto opacity-50">Ctrl+C</MenubarShortcut></MenubarItem>
                            <MenubarItem className="px-3 py-1.5 focus:bg-primary focus:text-primary-foreground rounded-sm">Paste <MenubarShortcut className="ml-auto opacity-50">Ctrl+V</MenubarShortcut></MenubarItem>
                        </MenubarContent>
                    </MenubarMenu>

                    <MenubarMenu>
                        <MenubarTrigger className="h-7 cursor-pointer px-3 text-[13px] font-normal hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground text-sidebar-foreground transition-none rounded-sm translate-y-[0.5px]">View</MenubarTrigger>
                        <MenubarContent className="border-sidebar-border bg-[#1c1c1e] text-sidebar-foreground min-w-[200px] shadow-2xl p-1">
                            <MenubarItem onClick={() => window.location.reload()} className="px-3 py-1.5 focus:bg-primary focus:text-primary-foreground rounded-sm">
                                Reload <MenubarShortcut className="ml-auto opacity-50">Ctrl+R</MenubarShortcut>
                            </MenubarItem>
                            <MenubarSeparator className="bg-sidebar-border my-1 mx-1" />
                            <MenubarItem onClick={zoomIn} className="px-3 py-1.5 focus:bg-primary focus:text-primary-foreground rounded-sm">
                                Zoom In <MenubarShortcut className="ml-auto opacity-50">Ctrl++</MenubarShortcut>
                            </MenubarItem>
                            <MenubarItem onClick={zoomOut} className="px-3 py-1.5 focus:bg-primary focus:text-primary-foreground rounded-sm">
                                Zoom Out <MenubarShortcut className="ml-auto opacity-50">Ctrl+-</MenubarShortcut>
                            </MenubarItem>
                            <MenubarItem onClick={zoomReset} className="px-3 py-1.5 focus:bg-primary focus:text-primary-foreground rounded-sm">
                                Reset Zoom <MenubarShortcut className="ml-auto opacity-50">Ctrl+0</MenubarShortcut>
                            </MenubarItem>
                        </MenubarContent>
                    </MenubarMenu>

                    <MenubarMenu>
                        <MenubarTrigger className="h-7 cursor-pointer px-3 text-[13px] font-normal hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground text-sidebar-foreground transition-none rounded-sm translate-y-[0.5px]">Window</MenubarTrigger>
                        <MenubarContent className="border-sidebar-border bg-[#1c1c1e] text-sidebar-foreground min-w-[200px] shadow-2xl p-1">
                            <MenubarItem onClick={minimize} className="px-3 py-1.5 focus:bg-primary focus:text-primary-foreground rounded-sm">Minimize</MenubarItem>
                            <MenubarItem onClick={maximize} className="px-3 py-1.5 focus:bg-primary focus:text-primary-foreground rounded-sm">Maximize</MenubarItem>
                        </MenubarContent>
                    </MenubarMenu>

                    <MenubarMenu>
                        <MenubarTrigger className="h-7 cursor-pointer px-3 text-[13px] font-normal hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground text-sidebar-foreground transition-none rounded-sm translate-y-[0.5px]">Help</MenubarTrigger>
                        <MenubarContent className="border-sidebar-border bg-[#1c1c1e] text-sidebar-foreground min-w-[200px] shadow-2xl p-1">
                            <MenubarItem className="px-3 py-1.5 focus:bg-primary focus:text-primary-foreground rounded-sm">Check for Updates...</MenubarItem>
                            <MenubarSeparator className="bg-sidebar-border my-1 mx-1" />
                            <MenubarItem className="px-3 py-1.5 focus:bg-primary focus:text-primary-foreground rounded-sm">About OptiRH</MenubarItem>
                        </MenubarContent>
                    </MenubarMenu>
                </Menubar>
            </div>

            <div
                className="flex items-center h-full"
                style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            >
                <button
                    onClick={minimize}
                    title="Minimize"
                    className="inline-flex h-full w-12 items-center justify-center text-sidebar-foreground/70 hover:bg-[#2d2d2d] hover:text-sidebar-foreground transition-colors"
                >
                    <Minus className="h-[14px] w-[14px]" />
                </button>
                <button
                    onClick={maximize}
                    title="Maximize"
                    className="inline-flex h-full w-12 items-center justify-center text-sidebar-foreground/70 hover:bg-[#2d2d2d] hover:text-sidebar-foreground transition-colors"
                >
                    <Square className="h-[10px] w-[10px]" />
                </button>
                <button
                    onClick={close}
                    title="Close"
                    className="inline-flex h-full w-12 items-center justify-center text-sidebar-foreground/70 hover:bg-[#e81123] hover:text-white transition-colors"
                >
                    <X className="h-[16px] w-[16px]" />
                </button>
            </div>
        </div>
    )
}
