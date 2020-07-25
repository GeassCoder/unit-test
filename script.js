let describeBlock = document.getElementById("describe-block");
let testBlock = document.getElementById("test-block");
let testCases = document.getElementById("test-cases");
let resultText = document.getElementById("result-text")

function addDescribe (event) {
    let button = event.target;
    let buttonsContainer = button.parentElement;
    let parent = buttonsContainer.parentElement;
    let describe = describeBlock.cloneNode(true);
    describe.removeAttribute("id");

    parent.insertBefore(describe, buttonsContainer);

    describe.querySelector('input').focus();
}

function addTest (event) {
    let button = event.target;
    let buttonsContainer = button.parentElement;
    let parent = buttonsContainer.parentElement;
    let test = testBlock.cloneNode(true);
    test.removeAttribute("id");

    parent.insertBefore(test, buttonsContainer);

    test.querySelector('input').focus();
}

function deleteDescribe (event) {
    let button = event.target;
    let describe = button.closest(".describe-block");
    describe.classList.add("shade");

    setTimeout(() => {
        let result = window.confirm("Are you sure to delete this?");
        if (!result) {
            describe.classList.remove("shade");
            return;
        }

        describe.remove();
    }, 50);
}

function deleteTest (event) {
    let button = event.target;
    let test = button.closest(".test-block");
    test.classList.add("shade");

    setTimeout(() => {
        let result = window.confirm("Are you sure to delete this?");
        if (!result) {
            test.classList.remove("shade");
            return;
        }

        test.remove();
    }, 50);
}

function toggle (event) {
    let button = event.target;
    let block = button.parentElement;

    if (!block.classList.contains("collapsed")) {
        let labelText = block.querySelector("label").textContent;
        let inputStr = block.querySelector("input").value;
        block.querySelector(".collapse-header").textContent = labelText + " " + inputStr;
    }

    block.classList.toggle("collapsed");
}

// extract result
function capitalize (str) {
    return (str[0] || "").toUpperCase() + str.slice(1);
}

function camelCase (str) {
    let parts = str.split("-");
    let firstPart = parts.shift();

    return firstPart + parts.map(capitalize).join("");
}

function classCase (str) {
    return str.split("-").map(capitalize).join("");
}


function initResult () {
    let unitPath = document.getElementById("what").value;
    let unitName = unitPath.split("/").pop().replace(/\..+$/, "");

    // true for util/service, false for component
    let isUtilOrService = unitPath.match(/util|service/i);

    let unitVarName = isUtilOrService ? camelCase(unitName) : classCase(unitName);

    let result = 
`import ${unitVarName} from '${unitPath}';
import { render, screen, fireEvent } from '@testing-library/react';

describe('${unitVarName}', () => {
  beforeEach(() => {

  });

###});`;

    return result;
}

function isDescribe (el) {
    return el.classList.contains("describe-block");
}

function isTest (el) {
    return el.classList.contains("test-block");
}

function getChildBlocks (el) {
    let result = [];
    for (let child of el.children) {
        if (isDescribe(child) || isTest(child)) {
            result.push(child);
        }
    }
    return result;
}

function getPrediction (str) {
    // should be rendered
    // should render
    if (str.includes("should be rendered") || str.includes("should render") || str.includes("should have been rendered")) {
        return "expect().toBeInTheDocument();"
    }

    // should have been called with
    if (str.includes("should have been called with")) {
        return "expect().shouldHaveBeenCalledWith();"
    }


    // should have been called
    if (str.includes("should have been called")) {
        return "expect().shouldHaveBeenCalled();"
    }

    return "";
}

function generateResult () {
    let init = initResult();
    let blocks = getChildBlocks(testCases);
    let str = "";
    let layer = 0;
    let indent = "  ";

    function traverseBlocks (blocks) {
        ++layer;

        const length = blocks.length;
        for (let i = 0; i < length; ++i) {
            let block = blocks[i];

            if (isDescribe(block)) {
                let describeStr = block.querySelector('input').value;
                str += `${indent.repeat(layer)}describe('${describeStr}', () => {\n`
                    + `${indent.repeat(layer + 1)}beforeEach(() => {\n\n`
                    + `${indent.repeat(layer + 1)}});\n\n`;

                let childBlocks = getChildBlocks(block.querySelector(".hide-in-collapse"));

                if (childBlocks.length) {
                    traverseBlocks(childBlocks);
                }

                str += `${indent.repeat(layer)}});\n`;
            }
            
            if (isTest(block)) {
                let testStr = block.querySelector('input').value;
                str += `${indent.repeat(layer)}test('${testStr}', () => {\n`;
                str += indent.repeat(layer + 1) + getPrediction(testStr) + "\n";
                str += `${indent.repeat(layer)}});\n`;
            }

            // if not last block, add blank line
            if (i !== length -1) {
                str += "\n";
            }
        }

        --layer;
    }

    traverseBlocks(blocks);

    const result = init.replace("###", str);

    resultText.value = result;
}

function copyResult () {
    resultText.select();
    document.execCommand('copy')
}