import React, { useEffect, useState } from "react";
import CompoundMonthlyRateForm from "./CompoundMonthlyRateForm";

const months = [
  { id: 1, name: "January" },
  { id: 2, name: "February" },
  { id: 3, name: "March" },
  { id: 4, name: "April" },
  { id: 5, name: "May" },
  { id: 6, name: "June" },
  { id: 7, name: "July" },
  { id: 8, name: "August" },
  { id: 9, name: "September" },
  { id: 10, name: "October" },
  { id: 11, name: "November" },
  { id: 12, name: "December" },
];

/* --------------------------------------------------
   Financial Year Generator
-------------------------------------------------- */
const generateFinancialYears = () => {
  const startYear = 2026;

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  let currentFY;
  let endYear;

  if (currentMonth >= 4) {
    currentFY = `${currentYear}-${String(
      currentYear + 1
    ).slice(-2)}`;

    endYear = currentYear + 1;
  } else {
    currentFY = `${currentYear - 1}-${String(
      currentYear
    ).slice(-2)}`;

    endYear = currentYear;
  }

  const financialYears = [];

  for (let year = startYear; year <= endYear; year++) {
    const next = String(year + 1).slice(-2);

    const fy = `${year}-${next}`;

    financialYears.push({
      value: fy,
      label: fy,
      selected: fy === currentFY,
    });
  }

  return financialYears;
};

/* --------------------------------------------------
   Component
-------------------------------------------------- */
const CompoundMonthlyReport = () => {
  const financialYears = generateFinancialYears();

  const currentFinancialYear =
    financialYears.find((fy) => fy.selected)?.value ||
    financialYears[0]?.value ||
    "";

  const [financialYear, setFinancialYear] = useState(
    currentFinancialYear
  );

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showRateForm, setShowRateForm] = useState(false);
  const [viewType, setViewType] = useState("qty");
  const [units, setUnits] = useState([]);

  /* --------------------------------------------------
     Load Report + Units
  -------------------------------------------------- */
  useEffect(() => {
    fetchReport();
    fetchUnits();
  }, [financialYear]);

  /* --------------------------------------------------
     Fetch Units
  -------------------------------------------------- */
  const fetchUnits = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/units"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch units");
      }

      const result = await response.json();

      setUnits(result.data || result);
    } catch (error) {
      console.error(
        "Error fetching units:",
        error
      );
    }
  };

  /* --------------------------------------------------
     Fetch Compound Monthly Report
  -------------------------------------------------- */
  const fetchReport = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `http://localhost:5000/api/monthly-compound-rate?financial_year=${encodeURIComponent(
          financialYear
        )}`
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Failed to fetch report"
        );
      }

      setData(result.data || []);
    } catch (error) {
      console.error(
        "Error fetching report:",
        error
      );

      setData([]);
    } finally {
      setLoading(false);
    }
  };

  /* --------------------------------------------------
     Group Data
  -------------------------------------------------- */
  const groupedData = Object.values(
    data.reduce((acc, row) => {
      const key =
        `${row.compound_id}-${row.unit_id}-${row.financial_year}`;

      if (!acc[key]) {
        acc[key] = {
          compound_id: row.compound_id,
          compound_code: row.compound_code,
          polymer_name: row.polymer_name,
          im_code: row.im_code,
          unit_id: row.unit_id || null,
          financial_year: row.financial_year,
          months: {},
        };
      }

      acc[key].months[row.month] = {
        qty: Number(row.qty) || 0,
        rate: Number(row.rate) || 0,
      };

      return acc;
    }, {})
  );

  /* --------------------------------------------------
     After Save
  -------------------------------------------------- */
  const handleRateSaved = () => {
    setShowRateForm(false);
    fetchReport();
  };

  /* --------------------------------------------------
     Unit Map
  -------------------------------------------------- */
  const unitMap = new Map(
    units.map((unit) => [
      String(unit.id),
      unit.unit,
    ])
  );

  return (
    <div className="compound-report-page">

      {/* Toolbar */}
      <div className="report-toolbar">

        <div className="report-filters">

          {/* Financial Year */}
          <div className="filter-field">
            <label className="form-label">
              <b>Financial Year</b>
            </label>

            <select
              className="form-control"
              value={financialYear}
              onChange={(e) =>
                setFinancialYear(e.target.value)
              }
            >
              {financialYears.map((fy) => (
                <option
                  key={fy.value}
                  value={fy.value}
                >
                  {fy.label}
                </option>
              ))}
            </select>
          </div>

          {/* View */}
          <div className="filter-field">
            <label className="form-label">
              <b>View</b>
            </label>

            <select
              className="form-control"
              value={viewType}
              onChange={(e) =>
                setViewType(e.target.value)
              }
            >
              <option value="qty">Qty</option>
              <option value="rate">Rate</option>
            </select>
          </div>

        </div>

        {/* Add Rate */}
        <button
          type="button"
          className="btn btn-success add-rate-btn"
          onClick={() =>
            setShowRateForm(true)
          }
        >
          <i className="fas fa-plus me-2"></i>
          Add Rate
        </button>

      </div>

      {/* Add Rate Form */}
      {showRateForm && (
        <CompoundMonthlyRateForm
          onClose={() =>
            setShowRateForm(false)
          }
          onSaved={handleRateSaved}
        />
      )}

      {/* Report */}
      <div className="table-responsive mt-3">

        {loading ? (
          <div className="text-center p-4">
            Loading...
          </div>
        ) : (
          <table className="table table-bordered compound-report-table">

            <thead>
              <tr>
                <th>Sr. No.</th>
                <th>Compound Code</th>
                <th>Polymer Name</th>
                <th>IM Code</th>
                <th>Unit</th>

                {months.map((month) => (
                  <th key={month.id}>
                    {month.name}{" "}
                    {viewType === "qty"
                      ? "Qty"
                      : "Rate"}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>

              {groupedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={5 + months.length}
                    className="text-center text-muted"
                  >
                    No data found
                  </td>
                </tr>
              ) : (

                groupedData.map(
                  (compound, index) => (
                    <tr
                      key={`${compound.compound_id}-${compound.unit_id}-${compound.financial_year}`}
                    >

                      <td>
                        {index + 1}
                      </td>

                      <td>
                        {compound.compound_code ||
                          "-"}
                      </td>

                      <td>
                        {compound.polymer_name ||
                          "-"}
                      </td>

                      <td>
                        {compound.im_code ||
                          "-"}
                      </td>

                      <td>
                        {unitMap.get(
                          String(
                            compound.unit_id
                          )
                        ) || "-"}
                      </td>

                      {months.map((month) => {

                        const monthData =
                          compound.months[
                            month.id
                          ] || {
                            qty: null,
                            rate: null,
                          };

                        return (
                          <td
                            key={month.id}
                            style={{
                              textAlign:
                                "center",
                            }}
                          >

                            {viewType === "qty"
                              ? monthData.qty ===
                                null
                                ? "-"
                                : monthData.qty.toLocaleString(
                                    "en-IN"
                                  )
                              : monthData.rate ===
                                null
                              ? "-"
                              : monthData.rate.toLocaleString(
                                  "en-IN",
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                )}

                          </td>
                        );
                      })}

                    </tr>
                  )
                )

              )}

            </tbody>
          </table>
        )}

      </div>
    </div>
  );
};

export default CompoundMonthlyReport;