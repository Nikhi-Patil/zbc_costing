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

const CompoundMonthlyReport = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showRateForm, setShowRateForm] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [year]);

  const fetchReport = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `http://localhost:5000/api/monthly-compound-rate?year=${year}`,
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to fetch report");
      }

      setData(result.data || []);
    } catch (error) {
      console.error("Error fetching report:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const groupedData = Object.values(
    data.reduce((acc, row) => {
      const key = `${row.compound_id}-${row.year}`;

      if (!acc[key]) {
        acc[key] = {
          compound_id: row.compound_id,
          compound_code: row.compound_code,
          polymer_name: row.polymer_name,
          im_code: row.im_code,
          year: row.year,
          months: {},
        };
      }

      acc[key].months[row.month] = {
        qty: Number(row.qty) || 0,
        rate: Number(row.rate) || 0,
      };

      return acc;
    }, {}),
  );

  const handleRateSaved = () => {
    setShowRateForm(false);
    fetchReport();
  };

  return (
    <div className="compound-report-page">
      {/* Toolbar */}
      <div className="report-toolbar">
        {/* Year */}
        <div className="year-filter">
          <label className="form-label">
            <b>Year</b>
          </label>

          <select
            className="form-control"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {[2025, 2026, 2027, 2028].map((itemYear) => (
              <option key={itemYear} value={itemYear}>
                {itemYear}
              </option>
            ))}
          </select>
        </div>

        {/* Add Rate */}
        <button
          type="button"
          className="btn btn-success add-rate-btn"
          onClick={() => setShowRateForm(true)}
        >
          <i className="fas fa-plus me-2"></i>
          Add Rate
        </button>
      </div>

      {/* Add Rate Form */}
      {showRateForm && (
        <CompoundMonthlyRateForm
          onClose={() => setShowRateForm(false)}
          onSaved={handleRateSaved}
        />
      )}

      {/* Report */}
      <div className="table-responsive mt-3">
        {loading ? (
          <div className="text-center p-4">Loading...</div>
        ) : (
          <table className="table table-bordered compound-report-table">
            <thead>
              <tr>
                <th rowSpan="2">Sr. No.</th>
                <th rowSpan="2">Compound Code</th>
                <th rowSpan="2">Polymer Name</th>
                <th rowSpan="2">IM Code</th>

                {months.map((month) => (
                  <th key={month.id} colSpan="2">
                    {month.name}
                  </th>
                ))}
              </tr>

              <tr>
                {months.map((month) => (
                  <React.Fragment key={month.id}>
                    <th>Qty</th>
                    <th>Rate</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>

            <tbody>
              {groupedData.length === 0 ? (
                <tr>
                  <td colSpan="29" className="text-center text-muted">
                    No data found
                  </td>
                </tr>
              ) : (
                groupedData.map((compound, index) => (
                  <tr key={`${compound.compound_id}-${compound.year}`}>
                    <td>{index + 1}</td>

                    <td>{compound.compound_code}</td>

                    <td>{compound.polymer_name}</td>

                    <td>{compound.im_code}</td>

                    {months.map((month) => {
                      const monthData = compound.months[month.id] || {
                        qty: 0,
                        rate: 0,
                      };

                      return (
                        <React.Fragment key={month.id}>
                          <td>{monthData.qty.toLocaleString("en-IN")}</td>

                          <td>
                            ₹
                            {monthData.rate.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CompoundMonthlyReport;
