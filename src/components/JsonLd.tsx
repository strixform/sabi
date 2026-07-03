/**
 * Injects a JSON-LD structured-data block. Server component — renders a plain
 * <script type="application/ld+json"> so crawlers read it without hydration.
 * Pass one object or an array of schema.org nodes.
 */
export function JsonLd({ data }: { data: object | object[] }) {
  const json = JSON.stringify(Array.isArray(data) ? data : [data]);
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is safe here (our own data, no user HTML).
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
