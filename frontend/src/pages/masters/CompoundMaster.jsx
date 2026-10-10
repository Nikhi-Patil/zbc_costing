import { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import API_BASE_URL from "../../config/api";

const CompoundMaster = () => {
  const [compounds, setCompounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    const fetchCompounds = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/compounds`);

        if (!response.ok) {
          throw new Error("Failed to fetch compounds");
        }

        const data = await response.json();
        setCompounds(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCompounds();
  }, []);

  const columns = [
    {
      name: "ID",
      selector: (row) => row.id,
      width: "70px",
      sortable: true,
      center: true,
    },
    {
      name: "Polymer Name",
      selector: (row) => row.polymer || "-",
      minWidth: "180px",
      wrap: true,
      sortable: true,
      center: true,
    },
    {
      name: "Compound Code",
      selector: (row) => row.compound_code || "-",
      minWidth: "160px",
      wrap: true,
      sortable: true,
    },
    {
      name: "IM Code",
      selector: (row) => row.im_code || "-",
      minWidth: "130px",
      sortable: true,
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
        minHeight: "48px",
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
        minHeight: "48px",
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

  const filteredCompounds = compounds.filter((compound) => {
    const search = searchText.toLowerCase().trim();

    if (!search) return true;

    return [
      compound.id,
      compound.polymer,
      compound.compound_code,
      compound.im_code,
      compound.created_by,
      compound.created_at,
      compound.updated_by,
      compound.updated_at,
    ].some((value) =>
      String(value ?? "")
        .toLowerCase()
        .includes(search),
    );
  });

  return (
    <div className="compound-master">
      <div className="compound-master-toolbar">
        <h2>Compound Master</h2>

        <div className="compound-master-search">
          <input
            type="text"
            placeholder="Search compounds..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            aria-label="Search compounds"
          />

          {searchText && (
            <button
              type="button"
              className="compound-master-search-clear"
              onClick={() => setSearchText("")}
              aria-label="Clear search"
              title="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {error && <p className="compound-master-error">Error: {error}</p>}

      <DataTable
        columns={columns}
        data={filteredCompounds}
        keyField="id"
        customStyles={customStyles}
        progressPending={loading}
        pagination
        paginationPerPage={10}
        paginationRowsPerPageOptions={[10, 25, 50, 100]}
        highlightOnHover
        responsive
        striped
        persistTableHead
        noDataComponent={
          searchText ? "No matching compounds found" : "No compounds found"
        }
      />
    </div>
  );
};

export default CompoundMaster;
