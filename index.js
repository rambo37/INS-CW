// form values
var month;
var resultsOption;
var date;
var top10Filter;
// collection of months
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
// lists of <data> elements from the XML files
var cases;
var tests;
var patients;
// table body
var tableBody;
// table column values
var dateCol;
var casesCol;
var testsProcessedCol;
var testCapacityCol;
var patientsCol;

// This function loads the XML files containing the data. Called when the body
// starts to load.
function initialize() {
  const request = new XMLHttpRequest();
  request.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      cases = this.responseXML.getElementsByTagName("data");
    }
  };
  request.open("GET", "http://localhost:8080/cases.xml", true);
  request.send();

  const request2 = new XMLHttpRequest();
  request2.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      tests = this.responseXML.getElementsByTagName("data");
    }
  };
  request2.open("GET", "http://localhost:8080/testing.xml", true);
  request2.send();

  const request3 = new XMLHttpRequest();
  request3.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      patients = this.responseXML.getElementsByTagName("data");
    }
  };
  request3.open("GET", "http://localhost:8080/hospital.xml", true);
  request3.send();
}

/*
 * Clear the date the user entered when they. Invoked when the user specifies a
 * resultOption associated with a month/all months rather than a date. Also 
 * updates the resultsOption variable since it has changed.
 */
function clearDate() {
  document.COVID_form.date.value = "";
  date = "";
  resultsOption = document.COVID_form.resultsOption.value;
}

/*
 * This function sets resultsOption to "before" if it is monthlyTotal, daily or
 * average. This is done so that it is impossible for the user to specify both 
 * a date and a resultsOption associated with months. It does not change 
 * resultsOption to "before" always since that could change it from "after" or 
 * "on" which would be confusing and inconvenient for the user.
 */
function changeResultsOption() {
  if (
    resultsOption == "monthlyTotal" ||
    resultsOption == "daily" ||
    resultsOption == "average"
  ) {
    document.COVID_form.resultsOption.value = "before";
    resultsOption = "before";
  }
}

/*
 * This function checks that the form is in a valid state and informs the user 
 * if it is not. It also updates the variables month, resultsOption, date and 
 * top10Filter so that their values reflect the state of the form. If the form
 * is in a valid state, then the table of results is displayed to the user.
 */
function checkForm() {
  month = document.COVID_form.month.value;
  resultsOption = document.COVID_form.resultsOption.value;
  date = document.COVID_form.date.value;
  top10Filter = document.COVID_form.top10Filter.value;

  // The user has specified a resultsOption associated with dates but they have
  // not entered a date. Therefore, display an alert to inform the user of the 
  // error so they can correct it.
  if (
    resultsOption == "before" ||
    resultsOption == "after" ||
    resultsOption == "on"
  ) {
    if (date == "") {
      alert("Please enter a date.");
      return;
    }
  }

  // If we reach here, the form is valid. So first we hide the table, then we
  // update it and once that is done, we can show it. We hide the table 
  // initially so the user does not see any intermediate table.

  document.getElementById("COVID_Table").hidden = true;
  updateTable();
  document.getElementById("COVID_Table").hidden = false;
}

/*
 * This function updates the table based on what state the form is in. If a 
 * date has been specified by the user, it calls the fillTableForDate() 
 * function and if the user instead wanted the results for a month (or all 
 * months), then it calls the fillTableForMonth() function instead (several
 * times if all months are selected).
 */
function updateTable() {
  resetTable(); // wipe the old table
  resetColumns(); // initialize the table column variables

  // If the date is not blank, we need to show results for a date
  if (date != "") {
    // Update the date/month column to display "Date" rather than "Month"
    document.getElementById("dateOrMonthColumn").innerHTML = "Date";
    dateCol = date;
    fillTableForDate();
    // If a filter has been provided by the user, we call applyTop10Filter()
    if (top10Filter != "none") {
      applyTop10Filter();
    }
    return;
  }

  // If we reach here, the user specified a month/all months instead of a date. 
  // Update the date column in the table to instead contain the text: "Month".
  document.getElementById("dateOrMonthColumn").innerHTML = "Month";

  // Fill the table with results for all months if that is what the user
  // specified
  if (month == "All") {
    for (let i = 1; i <= 12; i++) {
      fillTableForMonth(i);
    }
    if (top10Filter != "none") {
      applyTop10Filter();
    }
    return;
  }

  // Fill the table for a single month since the user entered a single month.
  var monthNumber = months.indexOf(month) + 1;
  fillTableForMonth(monthNumber);
  if (top10Filter != "none") {
    applyTop10Filter();
  }
}

// This method just empties the table body (all rows other than the top row).
function resetTable() {
  tableBody.innerHTML = "";
}

/*
 * This method initializes the column variables other than dateCol to contain 
 * the text "No data found". dateCol is initialized by other methods since it
 * is unique in the sense that there is no single way of initializing it - it
 * depends on the situation.
 */
function resetColumns() {
  casesCol = "No data found";
  testsProcessedCol = "No data found";
  testCapacityCol = "No data found";
  patientsCol = "No data found";
}

/*
 * This method fills the table when a date is specified. It looks at the 
 * resultsOption variable to decide which results to display - either the 
 * results on the date, before the date or after the date.
 */
function fillTableForDate() {
  // The indices of the specified date are found in the three lists. It will be
  // different for each list since the XML files have different numbers of 
  // results (<data> tags).

  // Initialize the index variables to -1 so we can tell if we were unable to 
  // find the specified date in the list later on.
  var casesIndex = -1;
  var testsIndex = -1;
  var patientsIndex = -1;

  for (let i = 0; i < cases.length; i++) {
    if (cases[i].childNodes[3].childNodes[0].nodeValue == date) {
      casesIndex = i;
      break;
    }
  }

  for (let i = 0; i < tests.length; i++) {
    if (tests[i].childNodes[3].childNodes[0].nodeValue == date) {
      testsIndex = i;
      break;
    }
  }

  for (let i = 0; i < patients.length; i++) {
    if (patients[i].childNodes[3].childNodes[0].nodeValue == date) {
      patientsIndex = i;
      break;
    }
  }

  // Now that we have found the index in each list if there is a corresponding
  // date, we just need to display the appropriate results depending on which 
  // resultsOption the user specified; "before", "after" or "on".

  // User wants the results on the specified date.
  if (resultsOption == "on") {
    // If we found the specified date in cases.xml, update casesCol.
    if (casesIndex != -1) {
      casesCol = cases[casesIndex].childNodes[4].childNodes[0].nodeValue;
    }
    // Same idea for the other 2 lists.
    if (testsIndex != -1) {
      // Since not every newPCRTestsByPublishDate tag in testing.xml has a 
      // value, we must first check that there is a value before trying to 
      // access it. This check appears several other times also.
      if (tests[testsIndex].childNodes[6].childNodes.length == 1) {
        testsProcessedCol =
          tests[testsIndex].childNodes[6].childNodes[0].nodeValue;
      }
      testCapacityCol = tests[testsIndex].childNodes[4].childNodes[0].nodeValue;
    }

    if (patientsIndex != -1) {
      patientsCol =
        patients[patientsIndex].childNodes[4].childNodes[0].nodeValue;
    }

    // If when we reach here we did not find data in the XML files with the
    // specified date, the column variables other than dataCol will still be 
    // set to "No data found" and dateCol will still be set to date because of
    // the call to resetColumns()

    fillTable();
    return;
  }
  // User wants results before the specified date
  else if (resultsOption == "before") {
    if (casesIndex == -1) {
      // The date provided by the user is not in cases.xml so we need to 
      // display either all the results if they specified a date after the last
      // date or we need to display no results since there are none before the
      // first result. We use cases for the first and last dates since cases 
      // has dates before the start and after the end of the other 2 lists.

      // Create Date objects for the specified date, the earliest date and the 
      // latest date. This is so we can use the < comparator for the Date class
      // to easily compare.
      var dateObject = new Date(date);
      var firstDate = new Date(
        cases[cases.length - 1].childNodes[3].childNodes[0].nodeValue
      );
      var lastDate = new Date(cases[0].childNodes[3].childNodes[0].nodeValue);

      // There is no data before the date specified by the user so just return 
      // a table with the date they specified and "No data found" in the other
      // columns.
      if (dateObject < firstDate) {
        fillTable();
        return;
      }

      // The user requested a date which is after all dates. Therefore, we 
      // display all of the results.  We do this by setting casesIndex to 0 so
      // the loop after this will go over all of the cases from the beginning.
      if (dateObject > lastDate) {
        casesIndex = 0;
      }
    }

    // Initialize j and k to hold the values of the index in tests and in 
    // patients respectively.
    var j = testsIndex;
    var k = patientsIndex;

    // Loop through all of the cases, starting from casesIndex and insert a row
    // into the table with all columns having appropriate values.
    for (let i = casesIndex; i < cases.length; i++) {
      resetColumns();
      dateCol = cases[i].childNodes[3].childNodes[0].nodeValue;
      casesCol = cases[i].childNodes[4].childNodes[0].nodeValue;

      // If the date is one of the first 3 dates in cases, then there is no
      // matching date in tests or in patients since cases.xml has more data. 
      // In this scenario we only want to start getting the values from the 
      // tests once the dates in cases are aligned. Since there are 3 extra 
      // dates at the start of cases, i and j will be pointing to the same date
      // when i is 3. So when this happens, j is assigned 0. The same is true 
      // for k.

      // If the date is one of the dates near the end of cases that is not in 
      // tests or patients, then j and k will remain -1 permanently and each 
      // call to fillTable() will result in "No data found" being displayed 
      // which is the desired result.

      if (j == -1 && i == 3) {
        j = 0;
      }

      if (j != -1 && j < tests.length) {
        if (tests[j].childNodes[6].childNodes.length == 1) {
          testsProcessedCol = tests[j].childNodes[6].childNodes[0].nodeValue;
        }
        testCapacityCol = tests[j].childNodes[4].childNodes[0].nodeValue;
        j++;
      }

      if (k == -1 && i == 3) {
        k = 0;
      }

      if (k != -1 && k < patients.length) {
        patientsCol = patients[k].childNodes[4].childNodes[0].nodeValue;
        k++;
      }

      fillTable();
    }
  }
  // user wants results after the specified date
  else if (resultsOption == "after") {
    if (casesIndex == -1) {
      var dateObject = new Date(date);
      var firstDate = new Date(
        cases[cases.length - 1].childNodes[3].childNodes[0].nodeValue
      );
      var lastDate = new Date(cases[0].childNodes[3].childNodes[0].nodeValue);

      // There is no data after the date specified by the user so just return a
      // table with the date they specified and "No data found" in the other
      // columns.
      if (dateObject > lastDate) {
        fillTable();
        return;
      }

      // The user requested a date which is before all dates. Therefore, we 
      // display all of the results. We do this by setting casesIndex to 
      // cases.length - 1 so the loop after this will go over all of the cases
      // from the beginning. The beginning in this case is the end of the list
      // since that is where the earliest dates are.
      if (dateObject < firstDate) {
        casesIndex = cases.length - 1;
      }
    }

    var j = testsIndex;
    var k = patientsIndex;

    // This time we iterate backward - this gives us only the dates after the 
    // starting date. The starting date is either the earliest date in cases 
    // (if the user specified a date before the first date in cases) or it is
    // the date the user specified.
    for (let i = casesIndex; i >= 0; i--) {
      resetColumns();
      dateCol = cases[i].childNodes[3].childNodes[0].nodeValue;
      casesCol = cases[i].childNodes[4].childNodes[0].nodeValue;

      // Once again it is possible for the current date to be in cases but not
      // in tests. Once i is 213, the dates of cases and tests are in sync so 
      // now we can set j equal to the earliest date in tests (the last one in 
      // the xml file).
      if (j == -1 && i == 213) {
        j = tests.length - 1;
      }

      if (j != -1 && j >= 0) {
        if (tests[j].childNodes[6].childNodes.length == 1) {
          testsProcessedCol = tests[j].childNodes[6].childNodes[0].nodeValue;
        }
        testCapacityCol = tests[j].childNodes[4].childNodes[0].nodeValue;
        j--;
      }

      // Same sort of idea for k but there are a different number of dates in 
      // patients than there are in tests so the number i needs to be before
      // being in sync with k is different.
      if (k == -1 && i == 226) {
        k = patients.length - 1;
      }

      if (k != -1 && k >= 0) {
        patientsCol = patients[k].childNodes[4].childNodes[0].nodeValue;
        k--;
      }

      fillTable();
    }
  }
}

/*
 * This method fills the table using a month number (1-12) to determine which
 * results to display. It also looks at what the resultsOption variable is set
 * to in order to display the correct information - either the monthly total,
 * daily or daily average.
 */
function fillTableForMonth(monthNumber) {
  // Start by wiping the old values of the column variables.
  resetColumns();

  // We will always be displaying the month the user specified in the date /
  // month column. However, the month variable may contain "All" so we set 
  // dateCol by accessing the appropriate index of months instead of directly 
  // setting dateCol equal to month.
  dateCol = months[monthNumber - 1];

  // If the month number is less than 10, append a 0 to the start so that the
  // month format matches the format of the dates in the XML documents.
  if (monthNumber < 10) {
    monthNumber = "" + "0" + monthNumber;
  }

  // Arrays to store the relevant results for each list
  var casesForMonth = new Array();
  var testsForMonth = new Array();
  var patientsForMonth = new Array();

  // Variables to store the totals in case the resultsOption needs them 
  // (monthly total or daily average)
  var totalCases = 0;
  var totalTestsProcessed = 0;
  var totalTestCapacity = 0;
  var totalPatients = 0;

  // Loop over the cases list and put all of the nodes which have a date with
  // the same month into casesForMonth. Also update the total number of cases 
  // for this month. Iterate over each list backwards so that the results are
  // in chronological order.
  for (let i = cases.length - 1; i >= 0; i--) {
    if (
      cases[i].childNodes[3].childNodes[0].nodeValue.substr(5, 2) == monthNumber
    ) {
      casesForMonth.push(cases[i]);
      // Need to turn the value in the XML file into a Number before we can use
      // it for numerical addition (otherwise string concatenation occurs 
      // instead).
      totalCases += Number(cases[i].childNodes[4].childNodes[0].nodeValue);
    }
  }

  // Same idea for the other lists but remember for testsProcessed an 
  // additional check is required
  for (let i = tests.length - 1; i >= 0; i--) {
    if (
      tests[i].childNodes[3].childNodes[0].nodeValue.substr(5, 2) == monthNumber
    ) {
      testsForMonth.push(tests[i]);
      if (tests[i].childNodes[6].childNodes.length == 1) {
        totalTestsProcessed += Number(
          tests[i].childNodes[6].childNodes[0].nodeValue
        );
      }
      totalTestCapacity += Number(
        tests[i].childNodes[4].childNodes[0].nodeValue
      );
    }
  }

  for (let i = patients.length - 1; i >= 0; i--) {
    if (
      patients[i].childNodes[3].childNodes[0].nodeValue.substr(5, 2) ==
      monthNumber
    ) {
      patientsForMonth.push(patients[i]);
      totalPatients += Number(
        patients[i].childNodes[4].childNodes[0].nodeValue
      );
    }
  }

  // For monthly total, we can simply set the column variables equal to the 
  // totals that we calculated while looping over the lists. If any of the 
  // lists are empty, the variable is already set to "No data found" for that
  // list.
  if (resultsOption == "monthlyTotal") {
    if (casesForMonth.length > 0) {
      casesCol = totalCases;
    }

    if (testsForMonth.length > 0) {
      testsProcessedCol = totalTestsProcessed;
      testCapacityCol = totalTestCapacity;
    }

    if (patientsForMonth.length > 0) {
      patientsCol = totalPatients;
    }

    fillTable();
  } else if (resultsOption == "daily") {
    // Update the date/month column to display "Date" rather than "Month"
    document.getElementById("dateOrMonthColumn").innerHTML = "Date";

    // If casesForMonth is empty, there is no data for the month and if the 
    // table is empty, the user would see nothing. So set dateCol to "No data
    // found" and then fill the table and return immediately. The other column
    // variables are still set to "No data found" due to the call to 
    // resetColumns() at the start of the method.
    if (casesForMonth.length == 0 && tableBody.rows.length == 0) {
      dateCol = "No data found";
      fillTable();
      return;
    }

    // If we reach here, there is data to display.

    // Index variables for testsForMonth and patientsForMonth respectively
    var j = 0;
    var k = 0;

    // Loop over the lists and populate the table.
    for (let i = 0; i < casesForMonth.length; i++) {
      resetColumns();
      dateCol = casesForMonth[i].childNodes[3].childNodes[0].nodeValue;
      casesCol = casesForMonth[i].childNodes[4].childNodes[0].nodeValue;

      if (testsForMonth.length > 0 && j < testsForMonth.length) {
        // Check that the current test has the same date as the current case
        if (testsForMonth[j].childNodes[3].childNodes[0].nodeValue == dateCol) {
          if (testsForMonth[j].childNodes[6].childNodes.length == 1) {
            testsProcessedCol =
              testsForMonth[j].childNodes[6].childNodes[0].nodeValue;
          }
          testCapacityCol =
            testsForMonth[j].childNodes[4].childNodes[0].nodeValue;
          j++;
        }
      }

      if (patientsForMonth.length > 0 && k < patientsForMonth.length) {
        if (
          patientsForMonth[k].childNodes[3].childNodes[0].nodeValue == dateCol
        ) {
          patientsCol =
            patientsForMonth[k].childNodes[4].childNodes[0].nodeValue;
          k++;
        }
      }

      fillTable();
    }
  } else {
    // resultsOption is dailyAverage
    // Averages are computed using the number of entries in the respective
    // array, and are rounded to 2 d.p.
    if (casesForMonth.length > 0) {
      casesCol = Math.round((totalCases / casesForMonth.length) * 100) / 100;
    }

    if (testsForMonth.length > 0) {
      testsProcessedCol =
        Math.round((totalTestsProcessed / testsForMonth.length) * 100) / 100;
      testCapacityCol =
        Math.round((totalTestCapacity / testsForMonth.length) * 100) / 100;
    }

    if (patientsForMonth.length > 0) {
      patientsCol =
        Math.round((totalPatients / patientsForMonth.length) * 100) / 100;
    }

    fillTable();
  }
}

/*
 * This function creates a row and inserts it into the table using the values 
 * of the column variables. It first checks if the 5th character of dateString 
 * is a dash (-). If it is, the dateCol variable contains a date and it then 
 * changes the format of dateString so that it is consistent with the form: 
 * DD/MM/YYYY. Otherwise, it just uses dateString as it is (identical to 
 * dateCol).
 */
function fillTable() {
  var dateString = dateCol;
  if (dateString.substr(4, 1) == "-") {
    dateString =
      dateCol.substr(8, 2) +
      "/" +
      dateCol.substr(5, 2) +
      "/" +
      dateCol.substr(0, 4);
  }

  let tableRow = tableBody.insertRow();
  tableRow.innerHTML =
    "<tr>" +
    '<td id = "dateOrMonthColumn">' +
    dateString +
    "</td>" +
    '<td id = "cases">' +
    casesCol +
    "</td>" +
    '<td id = "testsProcessed">' +
    testsProcessedCol +
    "</td>" +
    '<td id = "testCapacity">' +
    testCapacityCol +
    "</td>" +
    '<td id = "patients">' +
    patientsCol +
    "</td>" +
    "</tr>";
}

/*
 * Once a table has been generated, this function is called to filter the 
 * results, if necessary. If there are more than 10 rows in the table, the 10
 * rows with the largest value in the top10Filter column are kept in the table,
 * and the other rows are discarded. If there are fewer than 10 rows in the 
 * table to begin with, there is technically no need to do anything but it is 
 * still nice to sort the rows in descending order. If there are no rows or 
 * only 1 row, this method does nothing. If the column that the filter is being
 * applied on (for example, testsProcessed) has not got 10 rows which do not 
 * contain "No data found", fewer than 10 rows will be displayed since the "No
 * data found" rows are not actually the largest.
 */
function applyTop10Filter() {
  // No need to order the top 10 results when there are 0 results or just 1 
  // result.
  if (tableBody.rows.length < 2) {
    return;
  }

  var biggestRows = new Array();

  // Loop 10 times, each time getting the row with the largest entry. This
  // makes the resulting table ordered with the largest at the top.
  for (var i = 1; i <= 10; i++) {
    var largestValue = -1;
    var largestValueRowNumber = -1;
    var rows = tableBody.rows;
    // Find the largest row based on the specified filter (top10Filter)
    for (let j = 0; j < rows.length; j++) {
      if (rows[j].cells.namedItem(top10Filter).innerHTML != "No data found") {
        var value = Number(rows[j].cells.namedItem(top10Filter).innerHTML);
        if (value > largestValue) {
          largestValue = value;
          largestValueRowNumber = j;
        }
      }
    }
    // Either there are no more rows or the remaining rows contain no data and 
    // so should not be included
    if (largestValue == -1) {
      if (i == 1) {
        // If after the first pass, we were unable to find any values, all of
        // the values are "No data found". In this case, rather than returning 
        // a table with no rows, return a table with a row where each column 
        // has the value "No data found".
        resetTable();
        dateCol = "No data found";
        resetColumns();
        fillTable();
        return;
      }
      break; // we can now stop looping since we will not find any more rows.
    }

    // Put the row in the array of biggest rows and remove the row from the 
    // list of all rows so it is not included again
    biggestRows.push(rows[largestValueRowNumber]);
    tableBody.deleteRow(largestValueRowNumber);
  }

  // Clear the old table
  resetTable();

  // For each row in the top 10, update the column variables to the values in 
  // the row and then fill the table
  biggestRows.forEach((row) => {
    dateCol = row.cells.namedItem("dateOrMonthColumn").innerHTML;
    casesCol = row.cells.namedItem("cases").innerHTML;
    testsProcessedCol = row.cells.namedItem("testsProcessed").innerHTML;
    testCapacityCol = row.cells.namedItem("testCapacity").innerHTML;
    patientsCol = row.cells.namedItem("patients").innerHTML;
    fillTable();
  });
}
