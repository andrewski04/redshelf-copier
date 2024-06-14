// ==UserScript==
// @name         Bukah redshelf copying too
// @namespace    http://boukolos.com/
// @version      2024-06-12
// @description  Allows you to copy from redshelf
// @author       Joseph McDowell & Andrew Houser
// @match        http*://*.virdocs.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tampermonkey.net
// @grant        none
// @run-at document-end
// @noframes
// ==/UserScript==

/* the program layout (this is not in depth and is rudimentary, use this as a guide to read more comments)
Script checks if website has loaded every 100ms until it has (check line 198)  -> calls the run function (check line 26) -> defines functions and variables we need (xp, clone_element, set_new_button, set_observer) ->
After defining the functions and variables
|
|-->defines and observer that listens for the copying box to open (check line 106 to 115) -> calls a function (line 50) that replaces the buttons with our own buttons that do what we want, which is not trigger the copy limit
|-->defines a observer for ctrl+c to be pressed -> when the observer is called it calls a function (line 183, its a function literal, no name) that calls functions to read the page, find the beginning and end of our selection, and set the inbetween of the selection to our clipboard

PLEASE READ MORE, THIS DOESNT DESCRIBE THE WHOLE STORY

*/
function run() { // we put the main body of code in a run function se we can call it when its ready, like when the page is done loading/the book is done loading etc,
    // if it wasnt in a function itd run immediately, when it is not ready, since the script depends on the book view being ready
    var xp = function(xpath) { // this function provides xpath ability within tampermonkey, xpath is a way of getting html elements by using slashes, alot like a filesystem
        const result = document.evaluate(xpath, document, null, XPathResult.ANY_TYPE, null);
        let nodes = [];
        let node = result.iterateNext(); // i didnt make this, dont ask, it works in some sorta particular way
        while (node) {
            nodes.push(node);
            node = result.iterateNext();
        }
        return nodes;// it returns an array of elements that match the path provided in xpath, incase there are more than one, which is common
    }
    var dblog = () => {}; // this is a function that doest nothing, if you change it to equal (variables can be functions in js) console.log itll give you debug information, hence D e B ug LOG
    var copy_box_suffix = "/html/body/div[2]/div[3]/div/div[2]"; // this is the path to the box that contains all the copying information, like the copybutton and cancel button

    function clone_element(element, replace_flag) { // this function creates a clone of an html element you pass it, the replace_flag, when true, will delete the original, if false, it doesnt, it just copies and keeps the original
        var old_element = element;
        var new_element = old_element.cloneNode(true); //built in web function for copying a html element/node
        if (replace_flag == true) {
            old_element.parentNode.replaceChild(new_element, old_element); //replace the old with the new, type shit
        } else {
            old_element.parentNode.appendChild(new_element); // just add the new copy to the parent element of the element we are copying
        }
        return new_element; // give the new element back as a return value so the caller can modify the new element
    }

    function set_new_button() { // this function creates the given buttons like copy and copy raw, this function is called by an observer that calls it when the page is modified
        dblog("setting new buttons");
        var copy_button = xp(copy_box_suffix + "/div[3]/button[2]")[0]; // gets the copy button
        if (!copy_button || copy_button.parentNode.childNodes.length >= 3) { /* checks if the copy button exists or if the copybutton container has 3 buttons, the normal, unmodified copybox has two buttons
                                                                                 cancel, and copy, ours has cancel, copy and copyraw so this stops us from running the code again and making even more buttons
         */
            // the copybox hasnt been created yet, return
            dblog("copybuttons already created");
            return;
        }
        dblog("disconnecting observer");


        observer.disconnect(); /* disconnect the original change observer
         i recommend you read the comments on lower lines near the end regarding the observer, the observer basically checks for changes on the site, like for ex:
         when the copy box is opened, it adds a new element, this observer detects this, we disconnect the observer (disable it) because we are modifying the page
         and when we modify the page, the observer detects it, because it detects when the page is modified, this then calls start_new_button function, which then
         changes the page, which the observer detects, which calls this function, which changes the page, which the observer detects, which calls this function ... until infinity,
         which means itd crash the page, infinite loop
         */


        var text_container = xp(copy_box_suffix + "/div[1]/fieldset/span")[0]; // contains the text that you copied when the copy box was opened after you clicked copy text
        var info_container = xp(copy_box_suffix + "/div[2]/div/div/p")[0]; // contains information regarding how much you can copy,
        info_container.innerHTML =
            "This script allows you to copy <b>as much of this content as you want</b>"; // change the text for aesthetic purposes
        copy_button = clone_element(copy_button, true); // clone the original copy button
        //we clone the original copy button and delete it using the replace flag because, when it is copied, it deletes all the original logic/functions that are associated with the original
        //this allows us to add our own functions to the button so we can make it copy without sending the amount we copied, thus allowing us to copy as much as we want

        var copy_raw_button = clone_element(copy_button, false); // copys the copy button to make a new copy button,
        copy_raw_button.innerText = "Copy Raw"; // type shit makes the button say copy raw
        copy_raw_button.onclick = () => { // detect when the copy raw button is clicked
            navigator.clipboard.writeText( // write to clipboard the following
                text_container.innerHTML // this is what is inside the box that displays what youre going to copy
                .replace(/\n&nbsp;\n/g, "") // replace html encoded spaces with our own
                .replace(/\n\s*\n/g, "\n") // replace multiple newlines with new ones, without this the copied text is heavily spaced
                .replace(/&lt;/g, "<") // replace html encoded less than with normal less than
                .replace(/&gt;/g, ">") // same thing as above but with greater than
                .replace(/&amp;/g, "&") // replace html coded ampersands
            );
            copy_button.parentNode.firstChild.click(); // the cancel button is the first child of the button container, this clicks the cancel button to close the box
            // we do this instead of manually closing because there are specific ways that the original redshelf developers close the box, so we just basically call their code with this
        };
        copy_button.onclick = function() { //add our own custom code to our new copybutton

            navigator.clipboard.writeText(text_container.innerText);
            copy_button.parentNode.firstChild.click(); // clicks the cancel button, read the above explanation of this in the copy_raw_button thing
        };
        set_observer(); //resets the observer to its original state, so that if we open up the copybox again, itll make the changes again, if we didnt do this then it would only change the copy options once
    }

    var observer; // this is blank here because we need to be able to access observer within all functions and also change it between all functions and have it replicate, it basically acts as a global variable

    function set_observer() {
        dblog("setting observer");
        observer = new MutationObserver(set_new_button); // creates a mutation observer (observes mutations within the page) with the function to be called when a change is made being given as set_new_button
        observer.observe(xp("/html/body")[0], { //observe the body and everything below it,
            childList: true,
            subtree: true
        });
    }

    set_observer(); // sets the first observer,



    //ctrl v handler, this is basically a different component of this code, and it works in a slightly different way

    var iframedoc = xp("//*[@id='activeDocument']")[0].contentWindow.document; // the iframe is like a website within a website, this iframe contains the entirety of the book, which is like a website within a website
    var textChildren = iframedoc.getElementsByTagName("body")[0].children; // this contains all the text and items that are represented on the page/ basically the page

    var clipboardWriter = { // this is where we store what we have currently copied with the cursor
        text: "",
        writingEnabled: false,
    };
    var cw = clipboardWriter; // we use this shorthand becausae i got tired of writing clipboardwriter

    function writeElement(element) { // this function takes an element and appends it to what we have on our clipboard, see traversechildren as to why we do it like this.
        if (!element.innerText && element.nodeValue != null) {// check if the element is just pure text, and not a real element like p or div or h1 or whatever
            cw.text = cw.text + element.nodeValue;
        } else if (element.tagName == "p") {
            switch (
                element.className.split(" ")[0] // check the first element in the class name, we do this because this contains information of what type of text this is, like indented and such
            ) {
                case "indent":
                    cw.text = cw.text + "\n" + "  ".repeat(2); // this is indented by 2 units on the website, we replicate this
                    break;
                case "paralist1":
                    cw.text = cw.text + "\n" + "  ".repeat(3); // this is indented by 3 units on the website, we replicate this
                    break;
                case "paralist2":
                    cw.text = cw.text + "\n" + "  ".repeat(4); // this is indented by 4 units on the website, we replicate this
                    break;
                    // add more types here if you want to make the copying more accurate
                default:
                    cw.text = cw.text + "\n"; // by default if we cant detect what type of paragraph it is, indented or whatever we just add a newline, as it is probably its own line
                    break;
            }
        }
    }

    function traverseChildren(element) {
        /* this is going to be a very large, but necessary explaination,
           this function is basically a tree search, it may not seem like it but the html dom/html itself is a tree like data structure, thus why elements are called nodes
           we traverse all the nodes looking for classnames that correspond to the beginning of what we have highlighted
           redshelf has their own way of implementing copying that doesnt use the default text copying implemented by most text viewers in windows, it places gray boxes
           over the text we have copied and marks the beginning and end of the copybox within html code by placing two SPAN elements with particular classnames, the classnames for
           beginning and ending are as follows below, rs-inline-boundary-start and rs-inline-boundary-end

           We treesearch for these elements, and when we encounter the start, we enable the writing enabled flag to designate that we are currently writing to the clipboard,
           for all elements afterwards, regardless of their classnames, we append their values to the copybox, and when we finally encounter the end box SPAN element, we disable
           clipboard writing,

           this algorithm copies everything from the beginning of the selection until the end, thus giving us a hacky way to copy what is currently selected, you may ask
           why dont we just look in their code to see what they copied, well their code is minified and seemingly obfuscated, so messing with redshelfs code would be silly when
           this method is simple
        */
        if (element.className == "rs-inline-boundary rs-inline-boundary-start") { // called when it encounters the  start of the selection box
            cw.writingEnabled = true; // enable the writing of elements to the clipboard
        } else if (element.className == "rs-inline-boundary rs-inline-boundary-end") {// called  when it encounters the end of the selection box
            cw.writingEnabled = false; // disable the writing of elements to the clipboard
        }
        if (cw.writingEnabled) {// check if we are supposed to write to the clipboard
            writeElement(element);//call the write element function, which extracts information from each element, this allows us to accomodate particular elements with special properties
        }
        for (var childNode of element.childNodes) { /* loop thru all children of the current node, and traverse them, which is where the "tree search" comes in
                                                       it starts with the book container and descends through its children, then the childrens children, and so on...
                                                       If im correct, i believe this is a pre-order tree traversal.
        */
            traverseChildren(childNode); // descend into child node
        }
    }
    document.addEventListener("keydown", function(e) { // waits for key to be pressed
        if (e.key == "c" && e.ctrlKey) { // checks if ctrl c is pressed, which is the copy keybind
            clipboardWriter.text = ""; // replaces old clipboard text with blank, so we can start the process of searching for what is copied and adding it to .text
            for (var element of textChildren) {
                traverseChildren(element); // look thru the children of the text container element
            }
            navigator.clipboard.writeText(clipboardWriter.text); // write what is in the clipboardWriter after it has traversed all text
            var cancelButton = xp("/html/body/div[2]/div[3]/div/div[1]/button")[0]; // when we select something it opens up the text options box, we close this when we do ctrl c, by clicking the close button on the box
            if (cancelButton) {
                cancelButton.click();
            }
        }
    })

}
window.addEventListener("load", () => { // waits for the page to load then calls the code
    var intervalId
    intervalId = setInterval(() => { /* setinterval sets a function to be called periodically, for us, 100ms, it calls until the activedocument isnt missing and then disables the interval
                                        so basically this checks over and over if the active document (the page) exists/has loaded and then calls the run function, (runs the code), then it
                                        clears the interval (disables the interval) so our code doesnt run more than once
        */
        var activeDoc = document.getElementById("activeDocument")
        if (activeDoc && activeDoc.style.height != "") { //we check the height because it is only fully loaded if the height is more than 0 / exists in general as a value
            run() // call our run function, read the description of that function for why we put all our code into one big function
            clearInterval(intervalId)
        }
    }, 100)
})