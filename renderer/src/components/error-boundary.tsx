import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
    errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 bg-red-950/10 text-red-500 rounded-md border border-red-500/20 m-8 overflow-auto max-w-full">
                    <h1 className="text-xl font-bold mb-4">Something went wrong.</h1>
                    <p className="font-mono text-sm mb-4">{this.state.error && this.state.error.toString()}</p>
                    <pre className="text-xs">{this.state.errorInfo?.componentStack}</pre>
                </div>
            );
        }

        return this.props.children;
    }
}
