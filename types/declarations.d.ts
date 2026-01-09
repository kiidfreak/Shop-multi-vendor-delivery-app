declare module "@nkzw/create-context-hook" {
    import { FC, ReactNode } from "react";

    type UseHook<T> = () => T;

    function createContextHook<T>(
        useValue: () => T
    ): [FC<{ children: ReactNode }>, UseHook<T>];

    export default createContextHook;
}

declare module "react-native-confetti-cannon";
