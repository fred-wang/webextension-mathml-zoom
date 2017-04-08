/* -*- Mode: Java; tab-width: 2; indent-tabs-mode:nil; c-basic-offset: 2 -*- */
/* vim: set ts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

var MathMLNameSpace = "http://www.w3.org/1998/Math/MathML";
var XHTMLNameSpace = "http://www.w3.org/1999/xhtml"

function unzoom(aEvent)
{
  // Remove the zoomed math from the document.
  var zoomedMath = aEvent.currentTarget;
  zoomedMath.removeEventListener("click", unzoom);
  zoomedMath.parentNode.removeChild(zoomedMath);
}

function zoom(aEvent)
{
  var math = aEvent.currentTarget;
  if (!math.parentNode || math.parentNode.namespaceURI !== XHTMLNameSpace) {
    // Ignore zoom request if the <math> is not inside an HTML container.
    // XXXfredw: Do we want to handle the case of MathML in SVG?
    return;
  }

  var previous = math.previousElementSibling;
  if (previous && previous.getAttribute("class") === "MathMLAddOnZoomed") {
    // The zoom is already visible, so we ignore this request.
    return;
  }

  // Create a div to store the zoomed math and register listener to unzoom it.
  var zoomedMath = document.createElement("div");
  zoomedMath.setAttribute("class", "MathMLAddOnZoomed");
  zoomedMath.style.fontSize = "200%";
  zoomedMath.appendChild(math.cloneNode(true));
  math.parentNode.insertBefore(zoomedMath, math);
  zoomedMath.addEventListener("click", unzoom);

  // Center the zoomed formula over the original one.
  var mathRect = math.getBoundingClientRect();
  var zoomedMathRect = zoomedMath.getBoundingClientRect();
  zoomedMath.style.left = (mathRect.left +
    (mathRect.width - zoomedMathRect.width) / 2 ) + "px";
  zoomedMath.style.top = (mathRect.top +
    (mathRect.heigth - zoomedMathRect.height) / 2) + "px";
}

function isMathElement(aNode)
{
  return (aNode.nodeType === Node.ELEMENT_NODE &&
          aNode.tagName === "math" &&
          aNode.namespaceURI === MathMLNameSpace);
}

function registerZoom(aMath)
{
  aMath.addEventListener("click", zoom);
}

function unregisterZoom(aMath)
{
  aMath.removeEventListener("click", zoom);
}

// Register the zoom event for the existing <math> elements.
var maths = document.body.getElementsByTagNameNS(MathMLNameSpace, "math");
for (var i = 0; i < maths.length; i++) {
  registerZoom(maths[i]);
}

// Track addition/removal of <math> elements.
var observer = new MutationObserver(function(aMutations) {
  aMutations.forEach(function(aMutation) {
    var i, node;

    // Register zoom event for new <math> elements.
    for (i = 0; i < aMutation.addedNodes.length; i++) {
      node = aMutation.addedNodes[i];
      if (!isMathElement(node)) {
        continue;
      }
      if (node.parentNode.getAttribute("class") !== "MathMLAddOnZoomed") {
        registerZoom(node);
      }
    }

    // Unregister zoom event for removed <math> elements.
    for (i = 0; i < aMutation.removedNodes.length; i++) {
      node = aMutation.removedNodes[i];
      if (!isMathElement(node)) {
        continue;
      }
      if (node.parentNode.getAttribute("class") !== "MathMLAddOnZoomed") {
        unregisterZoom(node);
      }
    }
  });
});
observer.observe(document.body, { childList: true, subtree: true });

// XXXfredw: When the addon SDK was used, this was used in order to clean things
// up after the add-on is disabled or uninstalled.
function cleanup()
{
  // Remove the listener
  var maths = document.body.getElementsByTagNameNS(MathMLNameSpace, "math");
  var i, node;
  for (i = 0; i < maths.length; i++) {
    node = maths[i];
    if (node.parentNode.getAttribute("class") !== "MathMLAddOnZoomed") {
      unregisterZoom(node);
    }
  }

  // Remove the observer.
  observer.disconnect();
}
