import React from "react";
import type { Components } from "react-markdown";
import { cn } from "cn";

export function cleanProps<T extends object>(props: T): Record<string, unknown> {
  const rest = { ...props } as Record<string, unknown>;
  delete rest.node;
  return rest;
}

export const markdownComponents: Components = {
  h1: ({ children, ...props }) => (
    <h1
      className="text-xl sm:text-2xl font-bold text-zinc-100 mt-4 mb-2 pb-1.5 border-b border-zinc-800 first:mt-0 tracking-tight"
      {...cleanProps(props)}
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2
      className="text-lg sm:text-xl font-semibold text-zinc-100 mt-3.5 mb-2 pb-1 border-b border-zinc-800/60 first:mt-0 tracking-tight"
      {...cleanProps(props)}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3
      className="text-base sm:text-lg font-semibold text-zinc-200 mt-3 mb-1.5 first:mt-0"
      {...cleanProps(props)}
    >
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4
      className="text-sm sm:text-base font-semibold text-zinc-200 mt-2.5 mb-1 first:mt-0"
      {...cleanProps(props)}
    >
      {children}
    </h4>
  ),
  h5: ({ children, ...props }) => (
    <h5
      className="text-xs sm:text-sm font-semibold text-zinc-300 mt-2 mb-1 uppercase tracking-wider first:mt-0"
      {...cleanProps(props)}
    >
      {children}
    </h5>
  ),
  h6: ({ children, ...props }) => (
    <h6
      className="text-xs font-semibold text-zinc-400 mt-2 mb-1 uppercase tracking-wider first:mt-0"
      {...cleanProps(props)}
    >
      {children}
    </h6>
  ),
  p: ({ children, ...props }) => (
    <p
      className="text-xs sm:text-sm text-zinc-300 leading-relaxed my-2.5 first:mt-0 last:mb-0"
      {...cleanProps(props)}
    >
      {children}
    </p>
  ),
  a: ({ children, href, ...props }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors cursor-pointer break-all"
      {...cleanProps(props)}
    >
      {children}
    </a>
  ),
  ul: ({ children, ...props }) => (
    <ul
      className="list-disc list-outside pl-5 my-2.5 space-y-1 text-xs sm:text-sm text-zinc-300 first:mt-0 last:mb-0"
      {...cleanProps(props)}
    >
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol
      className="list-decimal list-outside pl-5 my-2.5 space-y-1 text-xs sm:text-sm text-zinc-300 first:mt-0 last:mb-0"
      {...cleanProps(props)}
    >
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="leading-relaxed" {...cleanProps(props)}>
      {children}
    </li>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="border-l-2 border-zinc-600 pl-3.5 my-3 italic text-zinc-400 text-xs sm:text-sm bg-zinc-900/40 py-1 rounded-r first:mt-0 last:mb-0"
      {...cleanProps(props)}
    >
      {children}
    </blockquote>
  ),
  hr: ({ ...props }) => (
    <hr className="my-4 border-zinc-800" {...cleanProps(props)} />
  ),
  table: ({ children, ...props }) => (
    <div className="my-3 overflow-x-auto rounded-lg border border-zinc-800 first:mt-0 last:mb-0">
      <table className="w-full text-left text-xs border-collapse" {...cleanProps(props)}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead
      className="bg-zinc-900/90 text-zinc-200 font-semibold border-b border-zinc-800"
      {...cleanProps(props)}
    >
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }) => (
    <tbody className="divide-y divide-zinc-800/60" {...cleanProps(props)}>
      {children}
    </tbody>
  ),
  tr: ({ children, ...props }) => (
    <tr className="hover:bg-zinc-900/40 transition-colors" {...cleanProps(props)}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }) => (
    <th
      className="px-3 py-2 border-r border-zinc-800 last:border-r-0 font-medium text-zinc-200"
      {...cleanProps(props)}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td
      className="px-3 py-2 border-r border-zinc-800/60 last:border-r-0 text-zinc-300"
      {...cleanProps(props)}
    >
      {children}
    </td>
  ),
  pre: ({ children, ...props }) => (
    <pre
      className="bg-[#0c0c0e] border border-zinc-800 rounded-lg p-3 my-2.5 overflow-x-auto font-mono text-xs text-zinc-200 leading-relaxed shadow-xs"
      {...cleanProps(props)}
    >
      {children}
    </pre>
  ),
  code: ({ className, children, ...props }) => {
    const isInline = !className && !String(children).includes("\n");
    if (isInline) {
      return (
        <code
          className="px-1.5 py-0.5 rounded text-[11px] sm:text-xs font-mono text-zinc-200 bg-zinc-800/80 border border-zinc-700/60"
          {...cleanProps(props)}
        >
          {children}
        </code>
      );
    }
    return (
      <code className={cn("font-mono text-xs text-zinc-200", className)} {...cleanProps(props)}>
        {children}
      </code>
    );
  },
  input: ({ ...props }) => (
    <input
      type="checkbox"
      disabled
      className="size-3.5 rounded border-zinc-700 text-primary focus:ring-0 mr-2 align-middle accent-zinc-500 cursor-default"
      {...cleanProps(props)}
    />
  ),
};
