import React from 'react';

// MDX Components for course content
export const MDXComponents = {
  h1: (props: any) => <h1 className="text-3xl font-bold mb-4" {...props} />,
  h2: (props: any) => <h2 className="text-2xl font-semibold mb-3" {...props} />,
  h3: (props: any) => <h3 className="text-xl font-medium mb-2" {...props} />,
  p: (props: any) => <p className="mb-4 leading-relaxed" {...props} />,
  ul: (props: any) => <ul className="list-disc list-inside mb-4" {...props} />,
  ol: (props: any) => <ol className="list-decimal list-inside mb-4" {...props} />,
  li: (props: any) => <li className="mb-1" {...props} />,
  code: (props: any) => {
    if (props.className) {
      return (
        <pre className="bg-gray-100 rounded p-4 mb-4 overflow-x-auto">
          <code {...props} />
        </pre>
      );
    }
    return <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...props} />;
  },
  blockquote: (props: any) => (
    <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4" {...props} />
  ),
};

export default MDXComponents;

// MDXRenderer component for rendering MDX content
export function MDXRenderer({ source, components = {} }: { source: any; components?: any }) {
  // This is a placeholder - normally would use MDXRemote
  return (
    <div className="mdx-content">
      {/* MDX content would be rendered here */}
      <p>MDX content rendering placeholder</p>
    </div>
  );
}