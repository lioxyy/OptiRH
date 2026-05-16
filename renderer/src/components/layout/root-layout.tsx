import { TitleBar } from "../title-bar"

export function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
            <TitleBar />
            <main className="flex-1 overflow-hidden">
                {children}
            </main>
        </div>
    )
}
