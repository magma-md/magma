import MagmaRenderer from "./magmamd/renderer.js";

document.addEventListener("DOMContentLoaded", () => {
    const editor = document.getElementById("editor") as HTMLTextAreaElement;
    const previewElement = document.getElementById("preview") as HTMLElement;
    const previewButton = document.getElementById("preview-button");
    const renderer = new MagmaRenderer();
    let isPreview = false;

    if(!editor || !previewButton || !previewElement) return;

    previewElement.hidden = true;
    editor.hidden = false;

    previewButton.addEventListener("click", (event) => {
        event.preventDefault();
        togglePreview();
    });

    function togglePreview() {
        isPreview = !isPreview;
        
        editor.hidden = isPreview;
        previewElement.hidden = !isPreview;

        if(isPreview) {
            const contents = editor.value;
            if(!contents) {
                previewElement.innerHTML = '';
                return;
            }

            const html = renderer.render(contents);
            previewElement.innerHTML = html;
        }
    }
});
