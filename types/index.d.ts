import type { PluginContext, PluginInfo } from "@toast-ui/editor";

export interface MarkType<S> {
    name: string;

    schema: S;

    spec: MarkSpec;
}

export interface Mark {
    type: MarkType<S>;

    attrs: Attr;
}

export interface Attr {
    htmlAttrs: {
        [key: string]: string;
    } | null;
    htmlInline: boolean | null;
    classNames: string | null;
}

export interface PluginOptions {
    preset?: string[];
}

export default function fontSizePlugin(
    context: PluginContext,
    options: PluginOptions
): PluginInfo;
