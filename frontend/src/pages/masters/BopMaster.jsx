import { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import API_BASE_URL from "../../config/api";
import { Download} from "lucide-react";

const BopMaster = () => {
  const [bops, setBops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    const fetchBops = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/bops`);

        if (!response.ok) {
          throw new Error("Failed to fetch BOPs");
        }

        const data = await response.json();
        setBops(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBops();
  }, []);

  const columns = [
    {
      name: "ID",
      selector: (row) => row.id,
      width: "60px",
      center: true,
      sortable: true,
    },
    {
      name: "Part No",
      selector: (row) => row.part_no || "-",
      minWidth: "130px",
      wrap: true,
      sortable: true,
    },
    {
      name: "FG Code",
      selector: (row) => row.fg_code || "-",
      width: "100px",
      center: true,
      sortable: true,
    },
    {
      name: "BOP Part Name",
      selector: (row) => row.bop_part_name || "-",
      minWidth: "180px",
      wrap: true,
      sortable: true,
    },
    {
      name: "BOP Part No",
      selector: (row) => row.bop_part_no || "-",
      minWidth: "140px",
      wrap: true,
      sortable: true,
    },
    {
      name: "BOP ERP Code",
      selector: (row) => row.bop_erp_code || "-",
      width: "100px",
      wrap: true,
      center: true,
      sortable: true,
    },
    {
      name: "Supplier Name",
      selector: (row) => row.supplier_name || "-",
      minWidth: "170px",
      wrap: true,
      sortable: true,
    },
    {
      name: "Qty",
      selector: (row) => row.bop_quantity ?? "-",
      width: "70px",
      center: true,
      sortable: true,
    },
    {
      name: "UMO",
      selector: (row) => row.umo || "-",
      width: "70px",
      center: true,
      sortable: true,
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

  const filteredBops = bops.filter((bop) => {
    const search = searchText.toLowerCase().trim();

    if (!search) return true;

    return [
      bop.id,
      bop.part_no,
      bop.fg_code,
      bop.bop_part_name,
      bop.bop_part_no,
      bop.bop_erp_code,
      bop.supplier_name,
      bop.bop_quantity,
      bop.umo,
      bop.created_by,
      bop.created_at,
      bop.updated_by,
      bop.updated_at,
    ].some((value) =>
      String(value ?? "")
        .toLowerCase()
        .includes(search),
    );
  });

  const handleDownloadExcel = () => {
    if (filteredBops.length === 0) {
      alert("No BOP records available to export.");
      return;
    }

    const exportData = filteredBops.map((bop) => ({
      ID: bop.id,
      "Part No": bop.part_no || "-",
      "FG Code": bop.fg_code || "-",
      "BOP Part Name": bop.bop_part_name || "-",
      "BOP Part No": bop.bop_part_no || "-",
      "BOP ERP Code": bop.bop_erp_code || "-",
      "Supplier Name": bop.supplier_name || "-",
      Qty: bop.bop_quantity ?? "-",
      UMO: bop.umo || "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    worksheet["!cols"] = [
      { wch: 8 },
      { wch: 18 },
      { wch: 15 },
      { wch: 28 },
      { wch: 20 },
      { wch: 18 },
      { wch: 30 },
      { wch: 10 },
      { wch: 10 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "BOP Master");

    XLSX.writeFile(
      workbook,
      `BOP_Master_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };

  return (
    <div className="bop-master">
      <div className="bop-master-toolbar">
        <h2>BOP Master</h2>

        <div className="bop-master-actions">
          <div className="bop-master-search">
            <input
              type="text"
              placeholder="Search BOPs..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              aria-label="Search BOPs"
            />

            {searchText && (
              <button
                type="button"
                className="bop-master-search-clear"
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
            className="bop-master-export-btn"
            onClick={handleDownloadExcel}
            disabled={loading || filteredBops.length === 0}
          >
            <Download size={16} />
            Download Excel
          </button>
        </div>
      </div>

      {error && <p className="bop-master-error">Error: {error}</p>}

      <DataTable
        columns={columns}
        data={filteredBops}
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
          searchText ? "No matching BOPs found" : "No BOPs found"
        }
      />
    </div>
  );
};

export default BopMaster;
