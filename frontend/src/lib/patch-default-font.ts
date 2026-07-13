// Patches React Native's <Text> and <TextInput> so that every instance in the
// app renders with Instrument Serif by default, without having to edit every
// StyleSheet. Local `fontFamily` overrides still win because we prepend ours.

import * as React from "react";
import { Text, TextInput } from "react-native";

import { APP_FONT_REGULAR } from "@/src/hooks/use-app-fonts";

let patched = false;

export function patchDefaultFont(): void {
  if (patched) return;
  patched = true;

  const defaultTextStyle = { fontFamily: APP_FONT_REGULAR };

  // Text is a forwardRef component; its .render is the underlying render fn.
  // We intercept it and re-run the original with a merged style array.
  const TextAny = Text as unknown as {
    render: (props: unknown, ref: unknown) => React.ReactElement;
  };
  const originalTextRender = TextAny.render;
  TextAny.render = function patchedTextRender(props: any, ref: any) {
    const merged = {
      ...props,
      style: [defaultTextStyle, props?.style],
    };
    return originalTextRender.call(this, merged, ref);
  };

  const InputAny = TextInput as unknown as {
    render: (props: unknown, ref: unknown) => React.ReactElement;
  };
  const originalInputRender = InputAny.render;
  InputAny.render = function patchedInputRender(props: any, ref: any) {
    const merged = {
      ...props,
      style: [defaultTextStyle, props?.style],
    };
    return originalInputRender.call(this, merged, ref);
  };
}
