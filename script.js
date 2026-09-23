/* =========================================================
   FIXED DEPOSIT CALCULATOR
   Main JavaScript
   ========================================================= */


/* =========================================================
   1. DOM ELEMENTS
   ========================================================= */

// Form
const fdForm = document.getElementById("fdForm");

// Input fields
const depositAmountInput = document.getElementById("depositAmount");
const interestRateInput = document.getElementById("interestRate");
const durationInput = document.getElementById("duration");

// Calculation modes
const normalModeInput = document.getElementById("normalMode");
const compoundModeInput = document.getElementById("compoundMode");

// Compound frequency
const frequencyGroup = document.getElementById("frequencyGroup");
const compoundingFrequencyInput = document.getElementById(
    "compoundingFrequency"
);

// Buttons
const resetButton = document.getElementById("resetButton");

// Results
const maturityAmountElement = document.getElementById("maturityAmount");
const principalResultElement = document.getElementById("principalResult");
const interestResultElement = document.getElementById("interestResult");
const effectiveYieldResultElement = document.getElementById(
    "effectiveYieldResult"
);
const calculationModeResultElement = document.getElementById(
    "calculationModeResult"
);
const selectedModeBadgeElement = document.getElementById(
    "selectedModeBadge"
);

// Breakdown
const breakdownBody = document.getElementById("breakdownBody");

// Footer
const currentYearElement = document.getElementById("currentYear");


/* =========================================================
   2. CONSTANTS
   ========================================================= */

const CALCULATION_MODES = {
    NORMAL: "normal",
    COMPOUND: "compound"
};

const COMPOUNDING_FREQUENCIES = {
    1: "Annually",
    2: "Half-Yearly",
    4: "Quarterly",
    12: "Monthly (Illustrative)"
};


/* =========================================================
   3. INITIALIZATION
   ========================================================= */

/*
 * Set the current year in the footer.
 */
function initializeCalculator() {
    currentYearElement.textContent = new Date().getFullYear();

    updateFrequencyState();

    clearResults();

    attachEventListeners();
}


/* =========================================================
   4. EVENT LISTENERS
   ========================================================= */

function attachEventListeners() {

    // Calculate the FD when the form is submitted.
    fdForm.addEventListener("submit", function (event) {
        event.preventDefault();

        calculateFD();
    });


    // Reset the calculator.
    resetButton.addEventListener("click", function () {
        resetCalculator();
    });


    // Update the compound frequency UI whenever
    // the calculation mode changes.
    normalModeInput.addEventListener("change", function () {
        updateFrequencyState();
    });

    compoundModeInput.addEventListener("change", function () {
        updateFrequencyState();
    });


    /*
     * Clear individual validation errors while
     * the user corrects the corresponding input.
     */
    depositAmountInput.addEventListener("input", function () {
        clearFieldError(
            depositAmountInput,
            "depositError"
        );
    });

    interestRateInput.addEventListener("input", function () {
        clearFieldError(
            interestRateInput,
            "rateError"
        );
    });

    durationInput.addEventListener("input", function () {
        clearFieldError(
            durationInput,
            "durationError"
        );
    });
}


/* =========================================================
   5. MODE MANAGEMENT
   ========================================================= */

/*
 * Returns the currently selected calculation mode.
 */
function getSelectedMode() {

    if (compoundModeInput.checked) {
        return CALCULATION_MODES.COMPOUND;
    }

    return CALCULATION_MODES.NORMAL;
}


/*
 * Enable the compounding frequency selector only
 * when Compound Mode is selected.
 */
function updateFrequencyState() {

    const isCompoundMode =
        getSelectedMode() === CALCULATION_MODES.COMPOUND;

    compoundingFrequencyInput.disabled = !isCompoundMode;

    frequencyGroup.classList.toggle(
        "is-disabled",
        !isCompoundMode
    );
}


/* =========================================================
   6. MAIN CALCULATION
   ========================================================= */

function calculateFD() {

    clearAllErrors();

    const inputValues = getInputValues();

    const validationResult = validateInputs(inputValues);

    if (!validationResult.isValid) {
        return;
    }


    const {
        principal,
        annualRate,
        years
    } = inputValues;


    const selectedMode = getSelectedMode();

    let calculationResult;


    /*
     * Select the appropriate financial calculation.
     */
    if (selectedMode === CALCULATION_MODES.NORMAL) {

        calculationResult = calculateSimpleInterest(
            principal,
            annualRate,
            years
        );

    } else {

        const frequency =
            Number(compoundingFrequencyInput.value);

        calculationResult = calculateCompoundInterest(
            principal,
            annualRate,
            years,
            frequency
        );
    }


    /*
     * Protect the UI from invalid mathematical results.
     */
    if (!isValidCalculationResult(calculationResult)) {

        showGeneralCalculationError();

        return;
    }


    /*
     * Update all result sections.
     */
    updateResults(
        calculationResult,
        selectedMode,
        principal,
        years
    );
}


/* =========================================================
   7. GET INPUT VALUES
   ========================================================= */

function getInputValues() {

    return {
        principal: Number(depositAmountInput.value),
        annualRate: Number(interestRateInput.value),
        years: Number(durationInput.value)
    };
}


/* =========================================================
   8. INPUT VALIDATION
   ========================================================= */

function validateInputs(values) {

    let isValid = true;


    /*
     * Deposit amount
     */
    if (
        depositAmountInput.value.trim() === "" ||
        !Number.isFinite(values.principal) ||
        values.principal <= 0
    ) {

        showFieldError(
            depositAmountInput,
            "depositError",
            "Please enter a deposit amount greater than ₹0."
        );

        isValid = false;
    }


    /*
     * Interest rate
     */
    if (
        interestRateInput.value.trim() === "" ||
        !Number.isFinite(values.annualRate) ||
        values.annualRate < 0
    ) {

        showFieldError(
            interestRateInput,
            "rateError",
            "Please enter an interest rate of 0% or higher."
        );

        isValid = false;
    }


    /*
     * Duration
     *
     * Initial version intentionally accepts only
     * positive whole-number years.
     */
    if (
        durationInput.value.trim() === "" ||
        !Number.isFinite(values.years) ||
        values.years <= 0 ||
        !Number.isInteger(values.years)
    ) {

        showFieldError(
            durationInput,
            "durationError",
            "Please enter a positive whole number of years."
        );

        isValid = false;
    }


    return {
        isValid
    };
}


/* =========================================================
   9. SIMPLE INTEREST CALCULATION
   ========================================================= */

/*
 * Normal Mode:
 *
 * SI = (P × R × T) / 100
 *
 * Maturity = P + SI
 *
 * Interest remains based on the original principal.
 */
function calculateSimpleInterest(
    principal,
    annualRate,
    years
) {

    const simpleInterest =
        (principal * annualRate * years) / 100;

    const maturityAmount =
        principal + simpleInterest;


    /*
     * For simple interest, the annual yield is
     * the same as the entered annual interest rate.
     */
    const effectiveAnnualYield = annualRate;


    /*
     * Generate yearly rows.
     *
     * Interest is calculated on the original
     * principal every year.
     */
    const yearlyBreakdown = [];

    let openingBalance = principal;


    for (let year = 1; year <= years; year++) {

        const yearlyInterest =
            (principal * annualRate) / 100;

        const closingBalance =
            openingBalance + yearlyInterest;


        yearlyBreakdown.push({
            year,
            openingBalance,
            interest: yearlyInterest,
            closingBalance
        });


        openingBalance = closingBalance;
    }


    return {
        interest: simpleInterest,
        maturityAmount,
        effectiveAnnualYield,
        yearlyBreakdown
    };
}


/* =========================================================
   10. COMPOUND INTEREST CALCULATION
   ========================================================= */

/*
 * Compound Mode:
 *
 * A = P × (1 + r/n)^(n×t)
 *
 * Where:
 *
 * P = Principal
 * r = annual interest rate as decimal
 * n = compounding periods per year
 * t = duration in years
 *
 * The yearly breakdown is generated by actually
 * applying interest period by period.
 */
function calculateCompoundInterest(
    principal,
    annualRate,
    years,
    frequency
) {

    const rateDecimal =
        annualRate / 100;

    const periodicRate =
        rateDecimal / frequency;

    const totalPeriods =
        frequency * years;


    /*
     * Standard compound interest formula.
     */
    const maturityAmount =
        principal *
        Math.pow(
            1 + periodicRate,
            totalPeriods
        );


    const totalInterest =
        maturityAmount - principal;


    /*
     * Effective Annual Yield:
     *
     * EAY = (1 + r/n)^n - 1
     *
     * Convert back to percentage.
     */
    const effectiveAnnualYield =
        (
            Math.pow(
                1 + periodicRate,
                frequency
            ) - 1
        ) * 100;


    /*
     * Generate the yearly breakdown.
     *
     * Each compounding period updates the balance.
     * The updated balance is then used for the next
     * period.
     */
    const yearlyBreakdown = [];

    let balance = principal;


    for (let year = 1; year <= years; year++) {

        const openingBalance = balance;


        for (
            let period = 0;
            period < frequency;
            period++
        ) {

            balance =
                balance *
                (1 + periodicRate);
        }


        const yearlyInterest =
            balance - openingBalance;


        yearlyBreakdown.push({
            year,
            openingBalance,
            interest: yearlyInterest,
            closingBalance: balance
        });
    }


    /*
     * The period-by-period calculation and the
     * standard compound formula should agree.
     *
     * We use the standard formula as the official
     * final maturity value.
     */
    return {
        interest: totalInterest,
        maturityAmount,
        effectiveAnnualYield,
        yearlyBreakdown
    };
}


/* =========================================================
   11. VALIDATE CALCULATION RESULT
   ========================================================= */

function isValidCalculationResult(result) {

    if (!result) {
        return false;
    }


    if (
        !Number.isFinite(result.interest) ||
        !Number.isFinite(result.maturityAmount) ||
        !Number.isFinite(result.effectiveAnnualYield)
    ) {
        return false;
    }


    if (!Array.isArray(result.yearlyBreakdown)) {
        return false;
    }


    return result.yearlyBreakdown.every(function (row) {

        return (
            Number.isFinite(row.openingBalance) &&
            Number.isFinite(row.interest) &&
            Number.isFinite(row.closingBalance)
        );
    });
}


/* =========================================================
   12. UPDATE RESULTS
   ========================================================= */

function updateResults(
    result,
    selectedMode,
    principal,
    years
) {

    /*
     * Update the main maturity amount.
     */
    maturityAmountElement.textContent =
        formatCurrency(result.maturityAmount);


    /*
     * Update principal.
     */
    principalResultElement.textContent =
        formatCurrency(principal);


    /*
     * Update total interest.
     */
    interestResultElement.textContent =
        formatCurrency(result.interest);


    /*
     * Update effective annual yield.
     */
    effectiveYieldResultElement.textContent =
        formatPercentage(
            result.effectiveAnnualYield
        );


    /*
     * Update selected calculation mode.
     */
    const modeLabel =
        getModeLabel(selectedMode);

    calculationModeResultElement.textContent =
        modeLabel;

    selectedModeBadgeElement.textContent =
        modeLabel;


    /*
     * Generate the yearly table.
     */
    renderYearlyBreakdown(
        result.yearlyBreakdown
    );


    /*
     * Prevent unused-value warnings in future
     * extensions where duration may be displayed.
     */
    void years;
}


/* =========================================================
   13. MODE LABEL
   ========================================================= */

function getModeLabel(mode) {

    if (mode === CALCULATION_MODES.COMPOUND) {
        return "Compound";
    }

    return "Normal";
}


/* =========================================================
   14. YEARLY BREAKDOWN
   ========================================================= */

function renderYearlyBreakdown(rows) {

    /*
     * Clear the existing table.
     */
    breakdownBody.innerHTML = "";


    /*
     * Create a table row for each year.
     */
    rows.forEach(function (row) {

        const tableRow =
            document.createElement("tr");


        /*
         * Year
         */
        const yearCell =
            document.createElement("td");

        yearCell.className =
            "year-number";

        yearCell.textContent =
            `Year ${row.year}`;


        /*
         * Opening balance
         */
        const openingCell =
            document.createElement("td");

        openingCell.className =
            "text-right";

        openingCell.textContent =
            formatCurrency(row.openingBalance);


        /*
         * Interest
         */
        const interestCell =
            document.createElement("td");

        interestCell.className =
            "text-right interest-cell";

        interestCell.textContent =
            formatCurrency(row.interest);


        /*
         * Closing balance
         */
        const closingCell =
            document.createElement("td");

        closingCell.className =
            "text-right closing-balance";

        closingCell.textContent =
            formatCurrency(row.closingBalance);


        /*
         * Add cells to row.
         */
        tableRow.appendChild(yearCell);
        tableRow.appendChild(openingCell);
        tableRow.appendChild(interestCell);
        tableRow.appendChild(closingCell);


        /*
         * Add row to table body.
         */
        breakdownBody.appendChild(tableRow);
    });
}


/* =========================================================
   15. CURRENCY FORMATTING
   ========================================================= */

/*
 * Format numbers using the Indian numbering system.
 *
 * Example:
 *
 * 100000  → ₹1,00,000.00
 * 1250000 → ₹12,50,000.00
 */
function formatCurrency(value) {

    if (!Number.isFinite(value)) {
        return "₹0.00";
    }


    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    ).format(value);
}


/* =========================================================
   16. PERCENTAGE FORMATTING
   ========================================================= */

function formatPercentage(value) {

    if (!Number.isFinite(value)) {
        return "0.00%";
    }


    return `${value.toFixed(2)}%`;
}


/* =========================================================
   17. VALIDATION UI
   ========================================================= */

function showFieldError(
    inputElement,
    errorId,
    message
) {

    const errorElement =
        document.getElementById(errorId);


    inputElement.classList.add(
        "input-error"
    );


    inputElement.setAttribute(
        "aria-invalid",
        "true"
    );


    errorElement.textContent =
        message;
}


function clearFieldError(
    inputElement,
    errorId
) {

    const errorElement =
        document.getElementById(errorId);


    inputElement.classList.remove(
        "input-error"
    );


    inputElement.removeAttribute(
        "aria-invalid"
    );


    errorElement.textContent = "";
}


function clearAllErrors() {

    clearFieldError(
        depositAmountInput,
        "depositError"
    );

    clearFieldError(
        interestRateInput,
        "rateError"
    );

    clearFieldError(
        durationInput,
        "durationError"
    );
}


/* =========================================================
   18. GENERAL CALCULATION ERROR
   ========================================================= */

function showGeneralCalculationError() {

    /*
     * This is a defensive fallback.
     *
     * Normally this should never be reached because
     * all inputs are validated before calculation.
     */
    maturityAmountElement.textContent =
        "Unable to calculate";

    principalResultElement.textContent =
        "₹0.00";

    interestResultElement.textContent =
        "₹0.00";

    effectiveYieldResultElement.textContent =
        "0.00%";

    breakdownBody.innerHTML = `
        <tr class="empty-table-row">
            <td colspan="4">
                Unable to calculate the result.
                Please check your inputs and try again.
            </td>
        </tr>
    `;
}


/* =========================================================
   19. CLEAR RESULTS
   ========================================================= */

function clearResults() {

    maturityAmountElement.textContent =
        "₹0.00";

    principalResultElement.textContent =
        "₹0.00";

    interestResultElement.textContent =
        "₹0.00";

    effectiveYieldResultElement.textContent =
        "0.00%";

    calculationModeResultElement.textContent =
        "Normal";

    selectedModeBadgeElement.textContent =
        "Normal";


    breakdownBody.innerHTML = `
        <tr class="empty-table-row">
            <td colspan="4">
                Enter your FD details and click
                "Calculate Maturity" to see the
                yearly breakdown.
            </td>
        </tr>
    `;
}


/* =========================================================
   20. RESET CALCULATOR
   ========================================================= */

function resetCalculator() {

    /*
     * Reset the form fields.
     */
    fdForm.reset();


    /*
     * Explicitly restore Normal Mode.
     */
    normalModeInput.checked = true;
    compoundModeInput.checked = false;


    /*
     * Restore Quarterly as the default frequency.
     */
    compoundingFrequencyInput.value = "4";


    /*
     * Clear validation errors.
     */
    clearAllErrors();


    /*
     * Restore frequency selector state.
     */
    updateFrequencyState();


    /*
     * Clear all calculated results.
     */
    clearResults();


    /*
     * Return focus to the first input for
     * better keyboard accessibility.
     */
    depositAmountInput.focus();
}


/* =========================================================
   21. START APPLICATION
   ========================================================= */

initializeCalculator();