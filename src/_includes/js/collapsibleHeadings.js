document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".heading-collapse-toggle").forEach(button => {
        button.addEventListener("click", function () {
            const section = button.closest(".collapsible-section");
            if (!section) return;

            const content = Array.from(section.children).find(child =>
                child.classList && child.classList.contains("collapsible-content")
            );
            if (!content) return;

            const isExpanded = button.getAttribute("aria-expanded") === "true";
            button.setAttribute("aria-expanded", String(!isExpanded));
            section.classList.toggle("is-collapsed", isExpanded);
            content.hidden = isExpanded;
        });
    });
});
