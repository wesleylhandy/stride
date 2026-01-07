import type { ComponentType } from "react";

type MDXComponents = {
  [key: string]: ComponentType<any> | undefined;
};

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
  };
}

