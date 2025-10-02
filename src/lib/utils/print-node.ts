/**
 * printNode.ts
 * Print a DOM node (HTMLElement) with preserved styles and form values.
 *
 * Usage:
 *   await printNode(document.getElementById('card'));
 */

type PrintNodeOptions = {
  title?: string; // document title used in printed doc
  copyStyles?: boolean; // copy <style> and <link rel="stylesheet"> from parent document
  extraCss?: string; // optional extra CSS to inject (raw CSS text)
  removeAfterPrint?: boolean; // remove iframe after print (default true)
  keepPageBackground?: boolean; // keep page background (for e.g. colors)
};

export async function printNode(
  node: HTMLElement,
  opts: PrintNodeOptions = {}
): Promise<void> {
  if (!node) throw new Error("printNode: no node provided");

  const {
    title = document.title || "",
    copyStyles = true,
    extraCss = "",
    removeAfterPrint = true,
    keepPageBackground = false,
  } = opts;

  return new Promise<void>((resolve, reject) => {
    try {
      // Clone the node to avoid mutating original
      const clone = node.cloneNode(true) as HTMLElement;

      // Copy form values (inputs, textareas, selects) from original into clone
      const copyFormValues = (src: HTMLElement, dest: HTMLElement) => {
        const srcInputs = src.querySelectorAll<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >("input, textarea, select");
        const destInputs = dest.querySelectorAll<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >("input, textarea, select");
        srcInputs.forEach((s, i) => {
          const d = destInputs[i];
          if (!d) return;
          if (s instanceof HTMLTextAreaElement)
            (d as HTMLTextAreaElement).value = s.value;
          else if (s instanceof HTMLInputElement) {
            if (s.type === "checkbox" || s.type === "radio")
              (d as HTMLInputElement).checked = s.checked;
            else (d as HTMLInputElement).value = s.value;
          } else if (s instanceof HTMLSelectElement) {
            (d as HTMLSelectElement).value = (s as HTMLSelectElement).value;
          }
        });
      };
      copyFormValues(node, clone);

      // Create hidden iframe
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      iframe.style.overflow = "hidden";
      iframe.setAttribute("aria-hidden", "true");
      // Some browsers require display in document to actually render for print
      document.body.appendChild(iframe);

      const win = iframe.contentWindow;
      const doc = iframe.contentDocument || win?.document;
      if (!doc || !win)
        throw new Error("printNode: could not access iframe document");

      // Build document content
      doc.open();
      doc.write("<!doctype html><html><head><meta charset='utf-8'>");
      if (title) doc.write(`<title>${escapeHtml(title)}</title>`);

      // Optionally copy stylesheets and style tags
      if (copyStyles) {
        // copy <style>
        Array.from(document.querySelectorAll("style")).forEach((style) => {
          doc.write(style.outerHTML);
        });
        // copy <link rel=stylesheet>
        Array.from(document.querySelectorAll("link[rel=stylesheet]")).forEach(
          (link) => {
            const href = (link as HTMLLinkElement).href;
            if (href) {
              // Use absolute href to avoid relative path issues
              doc.write(`<link rel="stylesheet" href="${escapeAttr(href)}">`);
            }
          }
        );
      }

      // Inject extra css if provided
      if (extraCss) {
        doc.write(`<style>${extraCss}</style>`);
      }

      // Optionally preserve page background colors/images
      if (keepPageBackground) {
        const bodyStyle = window.getComputedStyle(document.body);
        const bg =
          bodyStyle.background ||
          bodyStyle.backgroundColor ||
          bodyStyle.backgroundImage;
        if (bg) {
          doc.write(`<style>html,body{background:${bg} !important;}</style>`);
        }
      }

      doc.write("</head><body>");
      // Container to hold the cloned node. Add a small wrapper so user can style easily.
      doc.write('<div id="print-root"></div>');
      doc.write("</body></html>");
      doc.close();

      // Append cloned node into iframe's document
      const root = doc.getElementById("print-root");
      if (!root)
        throw new Error("printNode: couldn't create print root in iframe");
      root.appendChild(clone);

      // Wait for resources (fonts, stylesheets) to load
      const onResourcesLoaded = () => {
        // Focus iframe window before printing (some browsers need this)
        win.focus();

        // Safari/Chrome sometimes need a slight delay to paint; use setTimeout 0 to enqueue print
        const doPrint = () => {
          try {
            // Listen for afterprint to resolve
            const cleanup = () => {
              win.removeEventListener("afterprint", afterPrintHandler);
              if (removeAfterPrint) {
                // Delay removal a bit more to avoid race conditions in some browsers
                setTimeout(() => {
                  try {
                    iframe.remove();
                  } catch (e) {}
                }, 500);
              }
              resolve();
            };
            const afterPrintHandler = () => cleanup();

            // Some browsers fire onafterprint on window, others on iframe.contentWindow
            win.addEventListener("afterprint", afterPrintHandler);

            // Call print
            // try/catch because some browsers block print if not user-initiated
            const printed = win.print();
            // In some browsers win.print() returns immediately, so we also set a fallback timeout
            setTimeout(() => {
              // If afterprint didn't fire within 2s, resolve anyway
              cleanup();
            }, 2000);
          } catch (err) {
            // If print failed (likely blocked), cleanup and reject
            try {
              iframe.remove();
            } catch (e) {}
            reject(err);
          }
        };

        // give browser one tick to layout
        setTimeout(doPrint, 0);
      };

      // Wait for stylesheet(s) to load: check document.readyState or individual stylesheets
      const links = Array.from(
        doc.querySelectorAll("link[rel=stylesheet]")
      ) as HTMLLinkElement[];
      if (links.length === 0) {
        // no external links: still wait for fonts/images possibly; use load event on iframe
        // wait for iframe's document readyState
        const checkReady = () => {
          if (
            doc.readyState === "complete" ||
            doc.readyState === "interactive"
          ) {
            onResourcesLoaded();
          } else {
            setTimeout(checkReady, 50);
          }
        };
        checkReady();
      } else {
        // wait until all link stylesheets dispatch load or have complete
        let remaining = links.length;
        const onLinkLoad = () => {
          remaining -= 1;
          if (remaining <= 0) onResourcesLoaded();
        };
        links.forEach((lnk) => {
          // Some browsers don't reliably fire load for cached CSS; use setTimeout fallback
          lnk.addEventListener("load", onLinkLoad);
          lnk.addEventListener("error", onLinkLoad);
          setTimeout(onLinkLoad, 1000); // ensure it won't hang forever
        });
      }
    } catch (err) {
      reject(err);
    }
  });
}

/* ---------- small helpers ---------- */

function escapeHtml(s: string) {
  return s.replace(
    /[&<>"']/g,
    (m) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        m
      ]!)
  );
}
function escapeAttr(s: string) {
  return (s || "").replace(/"/g, "&quot;");
}
