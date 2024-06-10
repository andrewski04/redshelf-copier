// ==UserScript==
// @name         RedShelf Copier
// @description  Bypass RedShelf's default copying, with work-in-progress format preservation
// @author       Andrew H.
// @version      1.0
// @namespace    http://adminarchives.com/
// @match        http*://*.virdocs.com/*
// @grant        none
// ==/UserScript==


(function() {
    'use strict';

    // Function to handle copy action
    function formatedCopy(action, popupContainer, button) {
        const textElement = popupContainer.querySelector('.noTranslate');

        if (textElement) {
            let text;
            if (action === 'formatted') {
                let htmlContent = textElement.innerHTML;
                // Replace special HTML entities with their corresponding characters
                htmlContent = htmlContent.replace(/&nbsp;/g, ' ')
                                         .replace(/&lt;/g, '<')
                                         .replace(/&gt;/g, '>')
                                         .replace(/&amp;/g, '&');
                text = htmlContent;
            } else if (action === 'raw') {
                text = textElement.innerText;
            }

            // Copy the text to clipboard
            navigator.clipboard.writeText(text).then(() => {
                console.log('Text copied to clipboard!');
                button.innerText = "Copied!"
            }).catch(err => {
                console.error('Failed to copy text: ', err);
                button.innerText = "Err: See console"
            });
        }
    }

    // Function to add the custom buttons
    function addCustomCopyButtons() {
        // Find Copy popup container. This query selector may need fixed if page is modified
        const popupContainer = document.querySelector('.MuiPaper-root.MuiPopover-paper.MuiPaper-elevation8.MuiPaper-rounded').querySelector('.MuiBox-root');

        if (popupContainer) {
            // Avoid duplicate buttons
            if (document.getElementById('custom-copy-button-formatted') || document.getElementById('custom-copy-button-raw')) {
                return;
            }

            // Create a container for the buttons to center them
            const buttonContainer = document.createElement('div');
            buttonContainer.style.display = 'flex';
            buttonContainer.style.justifyContent = 'center';
            buttonContainer.style.marginTop = '8px';

            // Create the "Copy Raw" button
            const customCopyButtonRaw = document.createElement('button');
            customCopyButtonRaw.id = 'custom-copy-button-raw';
            customCopyButtonRaw.innerText = 'Copy Raw';
            customCopyButtonRaw.style.margin = '0 10px';
            customCopyButtonRaw.style.padding = '10px 20px';
            customCopyButtonRaw.style.fontSize = '12px';
            customCopyButtonRaw.style.backgroundColor = '#007BFF';
            customCopyButtonRaw.style.color = '#FFFFFF';
            customCopyButtonRaw.style.border = 'none';
            customCopyButtonRaw.style.borderRadius = '5px';
            customCopyButtonRaw.style.cursor = 'pointer';

            // Create the "Copy Formatted" button
            const customCopyButtonFormatted = document.createElement('button');
            customCopyButtonFormatted.id = 'custom-copy-button-formatted';
            customCopyButtonFormatted.innerText = 'Copy Formatted';
            customCopyButtonFormatted.style.margin = '0 10px';
            customCopyButtonFormatted.style.padding = '10px 20px';
            customCopyButtonFormatted.style.fontSize = '12px';
            customCopyButtonFormatted.style.backgroundColor = '#28A745';
            customCopyButtonFormatted.style.color = '#FFFFFF';
            customCopyButtonFormatted.style.border = 'none';
            customCopyButtonFormatted.style.borderRadius = '5px';
            customCopyButtonFormatted.style.cursor = 'pointer';

            const buttonLabel = document.createElement('h3');
            buttonLabel.innerText = "RedShelf Copier V1";
            buttonLabel.style.textAlign = "center";
            buttonLabel.style.marginTop = "8px";

            // Append buttons to the container
            buttonContainer.appendChild(customCopyButtonFormatted);
            buttonContainer.appendChild(customCopyButtonRaw);

            // Append the container to the popup and add title
            popupContainer.prepend(buttonContainer);
            popupContainer.prepend(buttonLabel);

            // event listeners call copy function
            customCopyButtonFormatted.addEventListener('click', function() {
                formatedCopy('formatted', popupContainer, customCopyButtonFormatted);
            });

            customCopyButtonRaw.addEventListener('click', function() {
                formatedCopy('raw', popupContainer, customCopyButtonRaw);
            });
        }
    }

    // monitors dom changes to find popup.
    const observer = new MutationObserver((mutations) => {
        for (let mutation of mutations) {
            if (mutation.addedNodes.length) {
                addCustomCopyButtons();
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();
