//---------------------------------------------//
// Copyright (c) 2020 Ernesto Leonel Argüello.
// This file is covered by LICENSE at the root of this project.
//---------------------------------------------//

export function SortInts(ArrayInInput, Ascending) {
    let i = 0;
    let j = 0;
    let FirstTime = true;
    let ArrayIn = ArrayInInput; // Input.
    let CurrentChecked = 0; // Number currently checked.
    let CurrentCheckedIndex = 0; // Index of the currently checked number.
    let UsedIndexes = []; // Shows indexes already used, and in which order.
    let ArrayOut = []; // Finished product.

    let Compare = { // Cool dynamic operator.
        false: function(a, b) { return a > b },
        true: function(a, b) { return a < b },
    };

	function SortIntsLoop1() {
        FirstTime = true;
        if (ArrayIn.length == UsedIndexes.length) {
            return;
        }
        else {
            SortIntsLoop2();
            return;
        }
    }

    function SortIntsLoop2() {
        if (ArrayIn.length == i) {
            ArrayOut.push(CurrentChecked);
            UsedIndexes.push(CurrentCheckedIndex);
            i = 0;
            SortIntsLoop1();
            return;
        }
        else {
            SortIntsLoop3();
            return;
        }
    }

    function SortIntsLoop3() {
        if (UsedIndexes.length == j) {
            j = 0;
            if (FirstTime || Compare[Ascending](ArrayIn[i], CurrentChecked)) {
                CurrentChecked = ArrayIn[i];
                CurrentCheckedIndex = i;
                FirstTime = false;
            }
            i++;
            SortIntsLoop2();
            return;
        }
        else {
            if (UsedIndexes[j] == i) {
                j = 0;
                i++;
                SortIntsLoop2();
                return;
            }
            else {
                j++;
                SortIntsLoop3();
                return;
            }
        }
    }

    SortIntsLoop1();
    return [ArrayOut, UsedIndexes]; // Out.
}