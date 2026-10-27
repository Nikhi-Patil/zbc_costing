import { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import API_BASE_URL from "../../config/api";
import * as XLSX from "xlsx";
import { Download } from "lucide-react";

function PartMaster() {
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    const fetchParts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/parts`);

        if (!response.ok) {
          throw new Error("Failed to fetch parts");
        }

        const data = await response.json();
        setParts(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchParts();
  }, []);

  const columns = [
    {
      name: "ID",
      selector: (row) => row.id,
      sortable: true,
      center: true,
      width: "60px",
    },
    {
      name: "Part Name",
      selector: (row) => row.part_name || "-",
      sortable: true,
      wrap: true,
    },
    {
      name: "Part No",
      selector: (row) => row.part_no || "-",
      sortable: true,
      wrap: true,
    },
    {
      name: "FG Code",
      selector: (row) => row.fg_code || "-",
      sortable: true,
      width: "120px",
      center: true,
    },
    {
      name: "IM Code",
      selector: (row) => row.im_code || "-",
      sortable: true,
      width: "120px",
      center: true,
    },
    {
      name: "Inter Unit/Dept Code",
      selector: (row) => row.inter_code || "-",
      sortable: true,
      width: "150px",
      wrap: true,
      center: true,
    },
    {
      name: "Unit",
      selector: (row) => row.unit || "-",
      width: "80px",
      sortable: true,
      center: true,
    },
    {
      name: "Department",
      selector: (row) => row.department_name || "-",
      sortable: true,
      width: "150px",
      wrap: true,
      center: true,
    },
    {
      name: "Sub Department",
      selector: (row) => row.sub_department_name || "-",
      sortable: true,
      width: "160px",
      wrap: true,
      center: true,
    },
  ];

  const customStyles = {
    table: {
      style: {
        width: "100%",
      },
    },
    headRow: {
      style: {
        minHeight: "40px",
        backgroundColor: "#19244a",
        borderBottom: "1px solid #d7d7d7",
      },
    },
    headCells: {
      style: {
        justifyContent: "center",
        textAlign: "center",
        fontSize: "13px",
        fontWeight: "600",
        padding: "12px",
        color: "#ffffff",
        borderRight: "1px solid #d7d7d7",
      },
    },
    rows: {
      style: {
        minHeight: "35px",
        fontSize: "13px",
        borderBottom: "1px solid #d7d7d7",
        "&:hover": {
          backgroundColor: "#f9f9f9",
        },
      },
    },
    cells: {
      style: {
        padding: "12px",
        overflowWrap: "anywhere",
        borderRight: "1px solid #d7d7d7",
      },
    },
    pagination: {
      style: {
        borderTop: "1px solid #ddd",
        minHeight: "52px",
      },
    },
  };
  const filteredParts = parts.filter((part) => {
    const search = searchText.toLowerCase().trim();

    if (!search) return true;

    return [
      part.id,
      part.part_name,
      part.part_no,
      part.fg_code,
      part.im_code,
      part.inter_code,
      part.unit,
      part.department_name,
      part.sub_department_name,
      part.created_by,
      part.updated_by,
    ].some((value) =>
      String(value ?? "")
        .toLowerCase()
        .includes(search),
    );
  });

  const handleDownloadExcel = () => {
    if (filteredParts.length === 0) {
      alert("No part records available to export.");
      return;
    }

    const exportData = filteredParts.map((part) => ({
      ID: part.id,
      "Part Name": part.part_name || "-",
      "Part No": part.part_no || "-",
      "FG Code": part.fg_code || "-",
      "IM Code": part.im_code || "-",
      "Inter Unit/Dept Code": part.inter_code || "-",
      Unit: part.unit || "-",
      Department: part.department_name || "-",
      "Sub Department": part.sub_department_name || "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    worksheet["!cols"] = [
      { wch: 8 },
      { wch: 30 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 24 },
      { wch: 12 },
      { wch: 22 },
      { wch: 24 },
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Part Master");

    XLSX.writeFile(
      workbook,
      `Part_Master_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };

  return (
    <div className="part-master">
      <div className="part-master-toolbar">
        <h2>Part Master</h2>

        <div className="part-master-actions">
          <div className="part-master-search">
            <input
              type="text"
              placeholder="Search parts..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              aria-label="Search parts"
            />

            {searchText && (
              <button
                type="button"
                className="part-master-search-clear"
                onClick={() => setSearchText("")}
                aria-label="Clear search"
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <button
            type="button"
            className="part-master-export-btn"
            onClick={handleDownloadExcel}
            disabled={loading || filteredParts.length === 0}
          >
            <Download size={16} />
            Download Excel
          </button>
        </div>
      </div>

      {error && <p className="part-master-error">Error: {error}</p>}

      <DataTable
        columns={columns}
        data={filteredParts}
        keyField="id"
        customStyles={customStyles}
        progressPending={loading}
        pagination
        paginationPerPage={15}
        paginationRowsPerPageOptions={[15, 25, 50, 100]}
        highlightOnHover
        responsive
        striped
        persistTableHead
        noDataComponent={
          searchText ? "No matching parts found" : "No parts found"
        }
      />
    </div>
  );
}

export default PartMaster;
