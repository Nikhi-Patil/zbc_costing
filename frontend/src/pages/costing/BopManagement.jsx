import React, { useEffect, useRef, useState } from "react";
import TomSelect from "tom-select";
import { Pencil } from "lucide-react";
import DataTable from "react-data-table-component";
import "tom-select/dist/css/tom-select.css";
import "../../assets/css/BopManagement.css";

import API_BASE_URL from "../../config/api";

/* BOP MANAGEMENT */
const createEmptyBop = () => ({
  bopId: "",
  bopPartNo: "",
  bopPartName: "",
  supplierId: "",
  suppliers: [],
  commodity: "",
  assemblyQty: "",
});

const normalizeBopRow = (row) => ({
  bopId: row.bopId ?? row.bop_id ?? "",
  bopPartNo: row.bopPartNo ?? row.bop_part_no ?? "",
  bopPartNo: row.bopPartNo ?? row.bop_part_no ?? "",
  bopPartName: row.bopPartName ?? row.bop_part_name ?? "",
  supplierId: row.supplierId ?? row.supplier_id ?? "",
  suppliers: row.suppliers ?? [],
  commodity: row.commodity ?? "",
  assemblyQty:
    row.assemblyQty ??
    row.assembly_qty ??
    row.bopAssemblyQty ??
    row.bop_assembly_qty ??
    "",
});

const BopManagement = () => {
  /* PART DATA */
  const [parts, setParts] = useState([]);
  const [selectedPartNo, setSelectedPartNo] = useState("");
  const [selectedPart, setSelectedPart] = useState(null);
  const [bopsMaster, setBopsMaster] = useState([]);
  const [bopRows, setBopRows] = useState([]);
  const [loadingParts, setLoadingParts] = useState(false);
  const [loadingBops, setLoadingBops] = useState(false);
  const [loadingConfiguration, setLoadingConfiguration] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [mode, setMode] = useState("list");
  const partSelectRef = useRef(null);
  const partTomSelectRef = useRef(null);
  const bopFgSelectRefs = useRef({});
  const bopFgTomSelectRefs = useRef({});
  const bopFgDropdownCleanupRefs = useRef({});
  const [existingConfigurations, setExistingConfigurations] = useState([]);
  const [loadingExistingConfigurations, setLoadingExistingConfigurations] =
    useState(false);
  const [existingConfigurationSearch, setExistingConfigurationSearch] =
    useState("");

  /* LOAD PARTS */
  useEffect(() => {
    loadParts();
    loadBopMaster();
    loadExistingConfigurations();

    return () => {
      if (partTomSelectRef.current) {
        try {
          partTomSelectRef.current.destroy();
        } catch {}
        partTomSelectRef.current = null;
      }
      Object.values(bopFgDropdownCleanupRefs.current).forEach((cleanup) => {
        try {
          cleanup?.();
        } catch {}
      });

      Object.values(bopFgTomSelectRefs.current).forEach((instance) => {
        try {
          instance?.destroy();
        } catch {}
      });

      bopFgDropdownCleanupRefs.current = {};
      bopFgTomSelectRefs.current = {};
    };
  }, []);

  /* TOM SELECT - COMMON DROPDOWN POSITIONING */
  const focusDropdownSearch = (instance) => {
    if (!instance?.dropdown) {
      return;
    }
    const input = instance.dropdown.querySelector(
      ".dropdown-input input, input.dropdown-input, .dropdown-input",
    );
    if (input) {
      requestAnimationFrame(() => {
        try {
          input.focus();
          const length = input.value?.length ?? 0;
          input.setSelectionRange?.(length, length);
        } catch {}
      });
    }
  };

  const positionTomSelectDropdown = (instance) => {
    if (!instance?.control || !instance?.dropdown || !instance.isOpen) {
      return;
    }
    const controlRect = instance.control.getBoundingClientRect();
    const dropdown = instance.dropdown;
    const gap = 2;
    dropdown.style.position = "fixed";
    dropdown.style.left = `${Math.round(controlRect.left)}px`;
    dropdown.style.width = `${Math.round(controlRect.width)}px`;
    dropdown.style.right = "auto";
    dropdown.style.zIndex = "999999";
    dropdown.style.maxHeight = `${Math.max(
      120,
      Math.min(360, window.innerHeight - 20),
    )}px`;
    dropdown.style.overflowY = "auto";
    const dropdownHeight = Math.min(
      dropdown.scrollHeight || 0,
      360,
      Math.max(120, window.innerHeight - 20),
    );
    const spaceBelow = window.innerHeight - controlRect.bottom;
    const spaceAbove = controlRect.top;
    if (spaceBelow >= dropdownHeight + gap || spaceBelow >= spaceAbove) {
      dropdown.style.top = `${Math.round(controlRect.bottom + gap)}px`;
      dropdown.style.bottom = "auto";
    } else {
      dropdown.style.top = `${Math.max(
        4,
        Math.round(controlRect.top - dropdownHeight - gap),
      )}px`;
      dropdown.style.bottom = "auto";
    }
  };

  const setupTomSelectDropdownPositioning = (instance) => {
    let rafId = null;
    const reposition = () => {
      if (!instance?.isOpen) {
        return;
      }
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(() => {
        positionTomSelectDropdown(instance);
        rafId = null;
      });
    };

    const openHandler = () => {
      requestAnimationFrame(() => {
        positionTomSelectDropdown(instance);
        focusDropdownSearch(instance);
        requestAnimationFrame(() => {
          positionTomSelectDropdown(instance);
        });
      });
      window.addEventListener("scroll", reposition, true);
      window.addEventListener("resize", reposition);
    };

    const closeHandler = () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    instance.on("dropdown_open", openHandler);
    instance.on("dropdown_close", closeHandler);
    return () => {
      instance.off("dropdown_open", openHandler);
      instance.off("dropdown_close", closeHandler);
      closeHandler();
    };
  };

  /* TOM SELECT - PART NO. */
  useEffect(() => {
    if (!partSelectRef.current || loadingParts) {
      return;
    }

    if (partTomSelectRef.current) {
      try {
        partTomSelectRef.current.destroy();
      } catch {}
      partTomSelectRef.current = null;
    }
    const instance = new TomSelect(partSelectRef.current, {
      create: false,
      allowEmptyOption: true,
      maxOptions: null,
      placeholder: "Select Part No.",
      dropdownParent: document.body,
      dropdownInput: true,
      searchField: ["text"],
      openOnFocus: true,
      closeAfterSelect: true,
      selectOnTab: false,
      sortField: {
        field: "text",
        direction: "asc",
      },
      onChange: (value) => {
        handlePartChange(value);
      },
    });

    const cleanupDropdownPositioning =
      setupTomSelectDropdownPositioning(instance);
    partTomSelectRef.current = instance;
    if (selectedPartNo) {
      instance.setValue(String(selectedPartNo), true);
    } else {
      instance.clear(true);
    }

    return () => {
      cleanupDropdownPositioning();
      if (partTomSelectRef.current === instance) {
        try {
          instance.destroy();
        } catch {}
        partTomSelectRef.current = null;
      }
    };
  }, [parts, loadingParts, mode]);

  /* TOM SELECT - BOP FG CODE */
  useEffect(() => {
    const activeIndexes = new Set(bopRows.map((_, index) => String(index)));
    Object.entries(bopFgTomSelectRefs.current).forEach(([index, instance]) => {
      if (!activeIndexes.has(index)) {
        try {
          bopFgDropdownCleanupRefs.current[index]?.();
          instance?.destroy();
        } catch {}
        delete bopFgDropdownCleanupRefs.current[index];
        delete bopFgTomSelectRefs.current[index];
        delete bopFgSelectRefs.current[index];
      }
    });
    if (loadingConfiguration || loadingBops) {
      return undefined;
    }

    let cancelled = false;

    const timer = setTimeout(() => {
      if (cancelled) {
        return;
      }
      bopRows.forEach((row, rowIndex) => {
        const element = bopFgSelectRefs.current[rowIndex];
        if (!element || bopFgTomSelectRefs.current[rowIndex]) {
          return;
        }
        const instance = new TomSelect(element, {
          create: false,
          allowEmptyOption: true,
          maxOptions: null,
          dropdownInput: true,
          placeholder: "Search BOP FG Code",
          dropdownParent: document.body,
          searchField: ["text"],
          openOnFocus: true,
          closeAfterSelect: true,
          selectOnTab: false,
          hideSelected: false,
          sortField: {
            field: "text",
            direction: "asc",
          },
          onDropdownOpen: () => {
            requestAnimationFrame(() => {
              focusDropdownSearch(instance);
              positionTomSelectDropdown(instance);
            });
          },
          onChange: (value) => {
            handleBopMasterChange(rowIndex, value);
          },
        });
        bopFgDropdownCleanupRefs.current[rowIndex] =
          setupTomSelectDropdownPositioning(instance);
        bopFgTomSelectRefs.current[rowIndex] = instance;
        if (row.bopId) {
          instance.setValue(String(row.bopId), true);
        } else {
          instance.clear(true);
        }
      });
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [bopRows.length, mode, loadingConfiguration, loadingBops, bopsMaster]);

  /* SYNC BOP FG VALUES WITHOUT RECREATING TOM SELECT */
  useEffect(() => {
    bopRows.forEach((row, rowIndex) => {
      const instance = bopFgTomSelectRefs.current[rowIndex];
      if (!instance) {
        return;
      }
      const desiredValue = row.bopId ? String(row.bopId) : "";
      const currentValue = instance.getValue();
      if (String(currentValue || "") !== desiredValue) {
        instance.setValue(desiredValue, true);
      }
    });
  }, [bopRows]);

  /* LOAD PART MASTER */
  const loadParts = async () => {
    setLoadingParts(true);
    try {
      const response = await fetch(`${API_BASE_URL}/parts`);
      if (!response.ok) {
        throw new Error(`Failed to load parts (${response.status})`);
      }
      const result = await response.json();

      /* SUPPORT DIFFERENT RESPONSE FORMATS */
      const data = Array.isArray(result)
        ? result
        : Array.isArray(result.data)
          ? result.data
          : Array.isArray(result.parts)
            ? result.parts
            : [];

      // Do not show invalid Part Master records with a blank/null Part No.
      const validParts = data.filter((part) => {
        const partNo = part.part_no ?? part.partNo ?? "";
        return String(partNo).trim() !== "";
      });
      setParts(validParts);
    } catch (error) {
      console.error("LOAD PARTS ERROR:", error);
      showMessage(error.message || "Failed to load Part Master.", "error");
    } finally {
      setLoadingParts(false);
    }
  };

  /* LOAD BOP MASTER */
  const loadBopMaster = async () => {
    setLoadingBops(true);
    try {
      const response = await fetch(`${API_BASE_URL}/bops`);
      if (!response.ok) {
        throw new Error(`Failed to load BOP master (${response.status})`);
      }
      const result = await response.json();
      const data = Array.isArray(result)
        ? result
        : Array.isArray(result.data)
          ? result.data
          : Array.isArray(result.bops)
            ? result.bops
            : [];

      setBopsMaster(data);
    } catch (error) {
      console.error("LOAD BOP MASTER ERROR:", error);

      showMessage(error.message || "Failed to load BOP Master.", "error");
    } finally {
      setLoadingBops(false);
    }
  };

  const loadExistingConfigurations = async () => {
    setLoadingExistingConfigurations(true);
    try {
      const response = await fetch(`${API_BASE_URL}/part-bops`);
      if (!response.ok) {
        throw new Error(
          `Failed to load existing BOP configurations (${response.status})`,
        );
      }
      const result = await response.json();
      const data = Array.isArray(result)
        ? result
        : Array.isArray(result.data)
          ? result.data
          : [];

      setExistingConfigurations(data);
    } catch (error) {
      console.error("LOAD EXISTING BOP CONFIGURATIONS ERROR:", error);
      showMessage(
        error.message || "Failed to load existing BOP configurations.",
        "error",
      );
    } finally {
      setLoadingExistingConfigurations(false);
    }
  };

  /* PART SELECT */
  const handlePartChange = async (partNo) => {
    const value = String(partNo || "").trim();
    setSelectedPartNo(value);
    setMessage("");
    setMessageType("");

    /* CLEAR CURRENT DATA */
    setBopRows([]);
    setSelectedPart(null);

    /* FIND PART */
    const part =
      parts.find(
        (item) => String(item.part_no ?? item.partNo ?? "").trim() === value,
      ) || null;
    setSelectedPart(part);
    if (!value) {
      setMode("new");
      return;
    }

    /* LOAD SAVED BOP CONFIGURATION */
    await loadPartBopConfiguration(value);
  };

  /* LOAD PART BOP CONFIGURATION */
  const loadPartBopConfiguration = async (partNo) => {
    setLoadingConfiguration(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/part-bops/${encodeURIComponent(partNo)}`,
      );
      if (!response.ok) {
        throw new Error(
          `Failed to load BOP configuration (${response.status})`,
        );
      }
      const result = await response.json();
      const data = Array.isArray(result)
        ? result
        : Array.isArray(result.data)
          ? result.data
          : [];

      /* NO EXISTING CONFIGURATION */
      if (data.length === 0) {
        setBopRows([]);
        setMode("new");
        return;
      }

      /* EXISTING CONFIGURATION */
      const normalized = data.map(normalizeBopRow);

      /* REBUILD SUPPLIER OPTIONS */
      const rowsWithSuppliers = normalized.map((row) => {
        const master = bopsMaster.find(
          (item) => Number(item.id) === Number(row.bopId),
        );
        return {
          ...row,
          suppliers: getSupplierOptions(master),
        };
      });
      setBopRows(rowsWithSuppliers);
      setMode("edit");
    } catch (error) {
      console.error("LOAD PART BOP CONFIGURATION ERROR:", error);
      setBopRows([]);
      setSelectedPartNo("");
      setSelectedPart(null);
      await loadExistingConfigurations();
      setMode("list");
      showMessage(
        error.message || "Failed to load BOP configuration.",
        "error",
      );
    } finally {
      setLoadingConfiguration(false);
    }
  };

  /* GET SUPPLIER OPTIONS */
  const getSupplierOptions = (bop) => {
    if (!bop) {
      return [];
    }
    const supplierIds = String(bop.supplier_id ?? bop.supplierId ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const supplierNames = String(bop.supplier_name ?? bop.supplierName ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    return supplierIds.map((id, index) => ({
      id,
      name: supplierNames[index] || id,
    }));
  };

  /* SELECT BOP MASTER */
  const handleBopMasterChange = (rowIndex, bopId) => {
    const selected = bopsMaster.find(
      (item) => Number(item.id) === Number(bopId),
    );
    const suppliers = getSupplierOptions(selected);
    setBopRows((previous) =>
      previous.map((row, index) => {
        if (index !== rowIndex) {
          return row;
        }

        return {
          ...row,
          bopId: selected?.id || "",
          bopFgCode: selected?.bop_erp_code || selected?.bopFgCode || "",
          bopPartNo: selected?.bop_part_no || selected?.bopPartNo || "",
          bopPartName: selected?.bop_part_name || selected?.bopPartName || "",
          commodity: selected?.commodity || "",
          suppliers,
          supplierId: "",
          assemblyQty: row.assemblyQty || "",
        };
      }),
    );
  };

  /* UPDATE NORMAL FIELD */
  const handleRowChange = (rowIndex, field, value) => {
    setBopRows((previous) =>
      previous.map((row, index) =>
        index === rowIndex
          ? {
              ...row,
              [field]: value,
            }
          : row,
      ),
    );
  };

  /* ADD BOP ROW */
  const addBopRow = () => {
    if (!selectedPartNo) {
      showMessage("Please select a Part No. first.", "error");
      return;
    }
    setBopRows((previous) => [...previous, createEmptyBop()]);
    setMode("edit");
    setMessage("");
    setMessageType("");
  };

  /* DELETE BOP ROW */
  const deleteBopRow = (rowIndex) => {
    setBopRows((previous) => previous.filter((_, index) => index !== rowIndex));

    setMode("edit");
  };

  /* VALIDATE */
  const validateRows = () => {
    if (!selectedPartNo) {
      return "Please select a Part No.";
    }

    for (let index = 0; index < bopRows.length; index += 1) {
      const row = bopRows[index];
      if (!row.bopId) {
        return `Please select BOP FG Code in row ${index + 1}.`;
      }
      if (!row.supplierId) {
        return `Please select Supplier in row ${index + 1}.`;
      }
      if (
        row.assemblyQty === "" ||
        row.assemblyQty === null ||
        row.assemblyQty === undefined
      ) {
        return `Please enter Assembly Qty in row ${index + 1}.`;
      }
      const qty = Number(row.assemblyQty);
      if (!Number.isFinite(qty) || qty < 0) {
        return `Assembly Qty must be a valid non-negative number in row ${
          index + 1
        }.`;
      }
    }

    /* DUPLICATE BOP + SUPPLIER */
    const keys = new Set();
    for (let index = 0; index < bopRows.length; index += 1) {
      const row = bopRows[index];
      const key = `${row.bopId}-${row.supplierId}`;
      if (keys.has(key)) {
        return `Duplicate BOP/Supplier combination found in row ${index + 1}.`;
      }
      keys.add(key);
    }
    return null;
  };

  /* SAVE */
  const saveConfiguration = async () => {
    const validationError = validateRows();

    if (validationError) {
      showMessage(validationError, "error");
      return;
    }
    setSaving(true);
    setMessage("");
    setMessageType("");

    try {
      /* PREPARE DATA */
      const payloadRows = bopRows.map((row) => ({
        bopId: Number(row.bopId),
        supplierId: Number(row.supplierId),
        assemblyQty: Number(row.assemblyQty),
      }));

      /* SAVE */
      const method = mode === "new" ? "POST" : "PUT";
      const url =
        method === "POST"
          ? `${API_BASE_URL}/part-bops`
          : `${API_BASE_URL}/part-bops/${encodeURIComponent(selectedPartNo)}`;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          partNo: selectedPartNo,
          bops: payloadRows,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success === false) {
        throw new Error(
          result.message ||
            `Failed to save BOP configuration (${response.status})`,
        );
      }

      /* SUCCESS */
      showMessage(
        result.message || "BOP configuration saved successfully.",
        "success",
      );

      /* RELOAD FROM DATABASE */
      await loadExistingConfigurations();
      setSelectedPartNo("");
      setSelectedPart(null);
      setBopRows([]);
      setMode("list");
    } catch (error) {
      console.error("SAVE BOP CONFIGURATION ERROR:", error);
      showMessage(
        error.message || "Failed to save BOP configuration.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  /* MESSAGE */
  const showMessage = (text, type = "info") => {
    setMessage(text);
    setMessageType(type);
  };

  /* PART DETAILS */
  const getPartValue = (...keys) => {
    if (!selectedPart) {
      return "-";
    }

    for (const key of keys) {
      if (
        selectedPart[key] !== undefined &&
        selectedPart[key] !== null &&
        String(selectedPart[key]).trim() !== ""
      ) {
        return selectedPart[key];
      }
    }

    return "-";
  };

  /* TOTAL ASSEMBLY QTY */
  const totalAssemblyQty = bopRows.reduce(
    (total, row) => total + (Number(row.assemblyQty) || 0),
    0,
  );

  /* LIST / FORM NAVIGATION */
  const handleAddBop = () => {
    setSelectedPartNo("");
    setSelectedPart(null);
    setBopRows([]);
    setMessage("");
    setMessageType("");
    setMode("new");
  };

  const handleBackToList = async () => {
    setMode("list");
    setSelectedPartNo("");
    setSelectedPart(null);
    setBopRows([]);
    setMessage("");
    setMessageType("");
    await loadExistingConfigurations();
  };

  const handleEditBop = async (partNo) => {
    const value = String(partNo || "").trim();

    if (!value) {
      showMessage("Part No. is missing for this BOP configuration.", "error");
      return;
    }

    const part =
      parts.find(
        (item) => String(item.part_no ?? item.partNo ?? "").trim() === value,
      ) || null;

    setSelectedPartNo(value);
    setSelectedPart(part);
    setMessage("");
    setMessageType("");
    setMode("edit");

    await loadPartBopConfiguration(value);
  };

  const getExistingValue = (row, ...keys) => {
    for (const key of keys) {
      const value = row?.[key];

      if (
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ""
      ) {
        return value;
      }
    }

    return "";
  };

  /* BOP DETAILS DATA TABLE */
  const bopDetailsColumns = [
    {
      name: "Sr. No.",
      width: "70px",
      center: true,
      sortable: false,
      cell: (row) => {
        const rowIndex = bopRows.indexOf(row);
        return rowIndex + 1;
      },
    },
    {
      name: "BOP FG Code",
      width: "170px",
      cell: (row) => {
        const rowIndex = bopRows.indexOf(row);
        const rowValue = row.bopId || "";

        return (
          <select
            ref={(element) => {
              bopFgSelectRefs.current[rowIndex] = element;
            }}
            value={rowValue}
            disabled={loadingBops || saving}
          >
            <option value="">
              {loadingBops ? "Loading..." : "Select BOP"}
            </option>

            {bopsMaster.map((bop, index) => (
              <option key={bop.id ?? index} value={bop.id}>
                {bop.bop_erp_code}
              </option>
            ))}
          </select>
        );
      },
    },
    {
      name: "BOP Part No.",
      width: "160px",
      cell: (row) => <span>{row.bopPartNo || "-"}</span>,
    },
    {
      name: "Part Name",
      width: "200px",
      cell: (row) => <span>{row.bopPartName || "-"}</span>,
    },
    {
      name: "Supplier Name",
      width: "200px",
      cell: (row) => {
        const rowIndex = bopRows.indexOf(row);
        const supplierOptions = row.suppliers || [];

        return (
          <select
            value={row.supplierId || ""}
            disabled={!row.bopId || saving}
            onChange={(event) =>
              handleRowChange(rowIndex, "supplierId", event.target.value)
            }
          >
            <option value="">Select Supplier</option>

            {supplierOptions.map((supplier, index) => (
              <option key={supplier.id ?? index} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
        );
      },
    },
    {
      name: "Commodity",
      width: "150px",
      cell: (row) => <span>{row.commodity || "-"}</span>,
    },
    {
      name: "Assembly Qty",
      width: "130px",
      right: true,
      cell: (row) => {
        const rowIndex = bopRows.indexOf(row);

        return (
          <input
            type="number"
            min="0"
            step="0.0001"
            value={row.assemblyQty ?? ""}
            disabled={saving}
            onChange={(event) =>
              handleRowChange(rowIndex, "assemblyQty", event.target.value)
            }
          />
        );
      },
    },
    {
      name: "Action",
      width: "95px",
      center: true,
      sortable: false,
      cell: (row) => {
        const rowIndex = bopRows.indexOf(row);

        return (
          <button
            type="button"
            className="bop-row-delete"
            title="Delete row"
            onClick={() => deleteBopRow(rowIndex)}
            disabled={saving}
          >
            ×
          </button>
        );
      },
    },
  ];

  const bopDetailsTableStyles = {
    table: {
      style: {
        minWidth: "1050px",
        backgroundColor: "#ffffff",
      },
    },
    headRow: {
      style: {
        minHeight: "46px",
        backgroundColor: "#19224a",
        borderBottom: "1px solid #dbe1e8",
      },
    },
    headCells: {
      style: {
        paddingLeft: "12px",
        paddingRight: "12px",
        color: "#ffffff",
        fontFamily: '"Times New Roman", Times, serif',
        fontSize: "13px",
        fontWeight: 700,
        whiteSpace: "nowrap",
        borderRight: "1px solid #dbe1e8",
      },
    },
    rows: {
      style: {
        minHeight: "50px",
        fontFamily: '"Times New Roman", Times, serif',
        fontSize: "14px",
        color: "#374151",
        borderBottom: "1px solid #e5e7eb",
      },
      highlightOnHoverStyle: {
        backgroundColor: "#f8fafc",
      },
    },
    cells: {
      style: {
        paddingLeft: "10px",
        paddingRight: "10px",
        borderRight: "1px solid #e5e7eb",
        overflow: "visible",
      },
    },
    pagination: {
      style: {
        minHeight: "42px",
        borderTop: "1px solid #e5e7eb",
        fontFamily: '"Times New Roman", Times, serif',
        fontSize: "13px",
      },
    },
  };

  const filteredExistingConfigurations = existingConfigurations.filter(
    (row) => {
      const search = String(existingConfigurationSearch || "")
        .trim()
        .toLowerCase();

      if (!search) {
        return true;
      }

      const searchableValues = [
        getExistingValue(row, "part_no", "partNo"),
        getExistingValue(row, "part_name", "partName"),
        getExistingValue(row, "fg_code", "fgCode"),
        getExistingValue(row, "bop_fg_code", "bopFgCode"),
        getExistingValue(row, "bop_part_no", "bopPartNo"),
        getExistingValue(row, "bop_part_name", "bopPartName"),
        getExistingValue(row, "supplier_name", "supplierName"),
        getExistingValue(row, "commodity"),
        getExistingValue(
          row,
          "assembly_qty",
          "assemblyQty",
          "bop_assembly_qty",
          "bopAssemblyQty",
        ),
      ];

      return searchableValues.some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(search),
      );
    },
  );

  const existingConfigurationColumns = [
    {
      name: <span className="bop-header-text">Sr. No.</span>,
      width: "60px",
      center: true,
      sortable: false,
      cell: (_row, index) => index + 1,
    },

    {
      name: <span className="bop-header-text">Part No.</span>,
      selector: (row) =>
        String(getExistingValue(row, "part_no", "partNo") || ""),
      sortable: true,
      wrap: true,
    },

    {
      name: <span className="bop-header-text">FG Code</span>,
      selector: (row) =>
        String(getExistingValue(row, "fg_code", "fgCode") || ""),
      sortable: true,
      wrap: true,
      width: "100px",
    },

    {
      name: <span className="bop-header-text">BOP FG Code</span>,
      selector: (row) =>
        String(getExistingValue(row, "bop_fg_code", "bopFgCode") || ""),
      sortable: true,
      wrap: true,
      width: "100px",
    },

    {
      name: <span className="bop-header-text">BOP Part No.</span>,
      selector: (row) =>
        String(getExistingValue(row, "bop_part_no", "bopPartNo") || ""),
      sortable: true,
      wrap: true,
      width: "105px",
    },

    {
      name: <span className="bop-header-text">BOP Part Name</span>,
      selector: (row) =>
        String(getExistingValue(row, "bop_part_name", "bopPartName") || ""),
      sortable: true,
      wrap: true,
      width: "170px",
    },

    {
      name: <span className="bop-header-text">Supplier</span>,
      selector: (row) =>
        String(getExistingValue(row, "supplier_name", "supplierName") || ""),
      sortable: true,
      wrap: true,
      width: "170px",
    },

    {
      name: <span className="bop-header-text">Commodity</span>,
      selector: (row) => String(getExistingValue(row, "commodity") || ""),
      sortable: true,
      wrap: true,
      width: "90px",
    },

    {
      name: <span className="bop-header-text">Assembly Qty</span>,
      selector: (row) =>
        Number(
          getExistingValue(
            row,
            "assembly_qty",
            "assemblyQty",
            "bop_assembly_qty",
            "bopAssemblyQty",
          ) || 0,
        ),
      sortable: true,
      center: true,
      cell: (row) =>
        Number(
          getExistingValue(
            row,
            "assembly_qty",
            "assemblyQty",
            "bop_assembly_qty",
            "bopAssemblyQty",
          ) || 0,
        ).toLocaleString("en-IN", {
          maximumFractionDigits: 4,
        }),
      width: "80px",
    },

    {
      name: <span className="bop-header-text">Action</span>,
      width: "70px",
      center: true,
      sortable: false,
      cell: (row) => {
        const partNo = getExistingValue(row, "part_no", "partNo");

        return (
          <button
            type="button"
            className="bop-edit-icon-btn"
            onClick={() => handleEditBop(partNo)}
            disabled={loadingExistingConfigurations || loadingConfiguration}
            title="Edit BOP Configuration"
            aria-label="Edit BOP Configuration"
          >
            <Pencil size={16} strokeWidth={2} />
          </button>
        );
      },
    },
  ];

  /* RENDER */
  return (
    <div className="bop-management">
      {message && (
        <div className={`bop-management-message ${messageType}`}>{message}</div>
      )}

      {/* PAGE 1 - EXISTING CONFIGURATIONS */}
      {mode === "list" && (
        <>
          <div className="bop-management-selector">
            <div className="bop-management-content-header">
              <div>
                <h3 className="bop-management-selector-title">
                  BOP Management
                </h3>
              </div>

              <div className="bop-management-actions">
                <button
                  type="button"
                  className="bop-btn bop-btn-add"
                  onClick={handleAddBop}
                  disabled={loadingParts || loadingBops}
                >
                  + Add BOP
                </button>

                <button
                  type="button"
                  className="bop-btn bop-btn-secondary"
                  onClick={loadExistingConfigurations}
                  disabled={loadingExistingConfigurations}
                >
                  {loadingExistingConfigurations ? "Refreshing..." : "Refresh"}
                </button>
              </div>
            </div>
          </div>

          <div className="bop-management-content existing-bop-configurations">
            <div className="bop-management-content-header">
              <div>
                <h2 className="bop-management-content-title">
                  Existing BOP Configurations
                </h2>
              </div>
              <div className="bop-existing-table-tools">
                <div className="bop-existing-search">
                  <input
                    type="text"
                    value={existingConfigurationSearch}
                    onChange={(event) =>
                      setExistingConfigurationSearch(event.target.value)
                    }
                    placeholder="Search BOP configurations..."
                    aria-label="Search BOP configurations"
                  />
                  {existingConfigurationSearch && (
                    <button
                      type="button"
                      className="bop-existing-search-clear"
                      onClick={() => setExistingConfigurationSearch("")}
                      aria-label="Clear search"
                      title="Clear search"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="bop-table-wrapper">
              <DataTable
                columns={existingConfigurationColumns}
                data={filteredExistingConfigurations}
                progressPending={loadingExistingConfigurations}
                progressComponent={
                  <div className="bop-management-loading">
                    <span className="bop-loading-spinner" />
                    Loading existing configurations...
                  </div>
                }
                noDataComponent={
                  <div className="bop-management-empty">
                    <div className="bop-management-empty-icon">+</div>

                    <h3 className="bop-management-empty-title">
                      No Existing BOP Configurations
                    </h3>

                    <p className="bop-management-empty-text">
                      Click <strong>+ Add BOP</strong> to create the first
                      configuration.
                    </p>
                  </div>
                }
                pagination
                paginationPerPage={10}
                paginationRowsPerPageOptions={[10, 20, 50, 100]}
                highlightOnHover
                dense
                persistTableHead
                fixedHeader
                fixedHeaderScrollHeight="calc(100vh - 235px)"
              />
            </div>
          </div>
        </>
      )}

      {/* PAGE 2 - BOP FORM */}
      {(mode === "new" || mode === "edit") && (
        <>
          <div className="bop-management-selector">
            <div className="bop-management-content-header">
              <div>
                <h3 className="bop-management-selector-title">
                  {mode === "new"
                    ? "Add BOP Configuration"
                    : "Edit BOP Configuration"}
                </h3>

                <p className="bop-management-content-description">
                  {mode === "new"
                    ? "Select a Part No. and add its BOP components."
                    : `Update BOP components for Part No. ${selectedPartNo || "-"}.`}
                </p>
              </div>

              <div className="bop-management-actions">
                <button
                  type="button"
                  className="bop-btn bop-btn-cancel"
                  onClick={handleBackToList}
                  disabled={saving}
                >
                  ← Back to List
                </button>
              </div>
            </div>

            <div className="bop-management-selector-row">
              <div className="bop-management-field">
                <label>Part No.</label>

                <select
                  ref={partSelectRef}
                  value={selectedPartNo}
                  disabled={loadingParts || saving || mode === "edit"}
                  onChange={(event) => handlePartChange(event.target.value)}
                >
                  <option value="">
                    {loadingParts ? "Loading parts..." : "Select Part No."}
                  </option>

                  {parts.map((part, index) => {
                    const partNo = part.part_no ?? part.partNo ?? "";

                    if (!partNo) {
                      return null;
                    }

                    return (
                      <option
                        key={part.id ?? `${partNo}-${index}`}
                        value={partNo}
                      >
                        {partNo}
                        {part.part_name ? ` - ${part.part_name}` : ""}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>

          {selectedPartNo && (
            <>
              <div className="bop-part-information">
                <div className="bop-part-info-card">
                  <span className="bop-part-info-label">Part No.</span>
                  <span className="bop-part-info-value">{selectedPartNo}</span>
                </div>

                <div className="bop-part-info-card">
                  <span className="bop-part-info-label">Part Name</span>
                  <span className="bop-part-info-value">
                    {getPartValue("part_name", "partName")}
                  </span>
                </div>

                <div className="bop-part-info-card">
                  <span className="bop-part-info-label">FG Code</span>
                  <span className="bop-part-info-value">
                    {getPartValue("fg_code", "fgCode")}
                  </span>
                </div>
              </div>

              <div className="bop-management-content">
                <div className="bop-management-content-header">
                  <div>
                    <h2 className="bop-management-content-title">
                      BOP Configuration
                    </h2>

                    <p className="bop-management-content-description">
                      Add BOP components, select suppliers, and enter assembly
                      quantity.
                    </p>
                  </div>

                  <div className="bop-management-actions">
                    <button
                      type="button"
                      className="bop-btn bop-btn-add"
                      onClick={addBopRow}
                      disabled={saving || loadingBops}
                    >
                      + Add BOP
                    </button>

                    <button
                      type="button"
                      className="bop-btn bop-btn-save"
                      onClick={saveConfiguration}
                      disabled={saving || !selectedPartNo}
                    >
                      {saving
                        ? "Saving..."
                        : mode === "new"
                          ? "Save Configuration"
                          : "Update Configuration"}
                    </button>

                    <button
                      type="button"
                      className="bop-btn bop-btn-cancel"
                      onClick={handleBackToList}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                  </div>
                </div>

                {loadingConfiguration ? (
                  <div className="bop-management-loading">
                    <span className="bop-loading-spinner" />
                    Loading BOP configuration...
                  </div>
                ) : bopRows.length === 0 ? (
                  <div className="bop-management-empty">
                    <div className="bop-management-empty-icon">+</div>

                    <h3 className="bop-management-empty-title">No BOP Rows</h3>

                    <p className="bop-management-empty-text">
                      Add a BOP component to this Part No.
                    </p>

                    <div style={{ marginTop: "18px" }}>
                      <button
                        type="button"
                        className="bop-btn bop-btn-add"
                        onClick={addBopRow}
                        disabled={saving || loadingBops}
                      >
                        + Add BOP
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bop-table-wrapper">
                    <DataTable
                      columns={bopDetailsColumns}
                      data={bopRows}
                      customStyles={bopDetailsTableStyles}
                      progressPending={loadingConfiguration || loadingBops}
                      progressComponent={
                        <div className="bop-management-loading">
                          <span className="bop-loading-spinner" />
                          Loading BOP configuration...
                        </div>
                      }
                      pagination
                      paginationPerPage={10}
                      paginationRowsPerPageOptions={[10, 25, 50, 100]}
                      paginationComponentOptions={{
                        rowsPerPageText: "Rows:",
                        rangeSeparatorText: "of",
                        noRowsPerPage: false,
                        selectAllRowsItem: false,
                      }}
                      persistTableHead
                      highlightOnHover
                      responsive={false}
                      dense
                    />
                  </div>
                )}

                {bopRows.length > 0 && (
                  <div className="bop-management-footer">
                    <div className="bop-management-total">
                      Total BOP Rows: <strong>{bopRows.length}</strong>
                    </div>

                    <div className="bop-management-total">
                      Total Assembly Qty:{" "}
                      <strong>
                        {Number(totalAssemblyQty).toLocaleString("en-IN", {
                          maximumFractionDigits: 4,
                        })}
                      </strong>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default BopManagement;