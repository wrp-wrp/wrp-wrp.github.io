(function () {
    const galleryItems = Array.from(document.querySelectorAll("[data-gallery-item]"));
    if (!galleryItems.length) {
        return;
    }

    const lightbox = document.createElement("div");
    lightbox.className = "gallery-lightbox";
    lightbox.setAttribute("hidden", "");
    lightbox.innerHTML = [
        '<button type="button" class="gallery-lightbox-close" aria-label="Close preview">&times;</button>',
        '<button type="button" class="gallery-lightbox-nav gallery-lightbox-prev" aria-label="Previous image">&#10094;</button>',
        '<figure class="gallery-lightbox-figure">',
        '<img class="gallery-lightbox-image" alt="">',
        '<figcaption class="gallery-lightbox-caption"></figcaption>',
        "</figure>",
        '<button type="button" class="gallery-lightbox-nav gallery-lightbox-next" aria-label="Next image">&#10095;</button>'
    ].join("");
    document.body.appendChild(lightbox);

    const lightboxImage = lightbox.querySelector(".gallery-lightbox-image");
    const lightboxCaption = lightbox.querySelector(".gallery-lightbox-caption");
    const closeButton = lightbox.querySelector(".gallery-lightbox-close");
    const prevButton = lightbox.querySelector(".gallery-lightbox-prev");
    const nextButton = lightbox.querySelector(".gallery-lightbox-next");

    let currentIndex = 0;

    function isOpen() {
        return lightbox.classList.contains("is-open");
    }

    function setImage(index) {
        currentIndex = (index + galleryItems.length) % galleryItems.length;
        const item = galleryItems[currentIndex];
        const fullUrl = item.getAttribute("href");
        const altText = item.getAttribute("data-gallery-alt") || "";

        lightboxImage.setAttribute("src", fullUrl);
        lightboxImage.setAttribute("alt", altText);
        lightboxCaption.textContent = altText;
    }

    function open(index) {
        setImage(index);
        lightbox.removeAttribute("hidden");
        lightbox.classList.add("is-open");
        document.body.classList.add("gallery-open");
    }

    function close() {
        lightbox.classList.remove("is-open");
        lightbox.setAttribute("hidden", "");
        document.body.classList.remove("gallery-open");
        lightboxImage.removeAttribute("src");
    }

    galleryItems.forEach((item, index) => {
        item.setAttribute("data-gallery-index", String(index));
        item.addEventListener("click", (event) => {
            event.preventDefault();
            open(index);
        });
    });

    closeButton.addEventListener("click", close);
    prevButton.addEventListener("click", () => setImage(currentIndex - 1));
    nextButton.addEventListener("click", () => setImage(currentIndex + 1));

    lightbox.addEventListener("click", (event) => {
        if (event.target === lightbox) {
            close();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (!isOpen()) {
            return;
        }

        if (event.key === "Escape") {
            close();
        } else if (event.key === "ArrowLeft") {
            setImage(currentIndex - 1);
        } else if (event.key === "ArrowRight") {
            setImage(currentIndex + 1);
        }
    });
})();
