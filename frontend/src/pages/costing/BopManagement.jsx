import React, { useEffect, useRef, useState } from "react";
import TomSelect from "tom-select";
import "tom-select/dist/css/tom-select.css";
import "../../assets/css/BopManagement.css";

import API_BASE_URL from "../../config/api";

/* BOP MANAGEMENT */

/*HELPERS */

const createEmptyBop = () => ({
  id: null,
  bopId: "",
  bopFgCode: "",
  bopPartNo: "",
  bopPartName: "",
  supplierId: "",
  suppliers: [],
  commodity: "",
  assemblyQty: "",
});

const normalizeBopRow = (row) => ({
  id: row.id ?? null,
  bopId: row.bopId ?? row.bop_id ?? "",
  bopFgCode: row.bopFgCode ?? row.bop_fg_code ?? "",
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

/* COMPONENT */

const BopManagement = () => {

  /* PART DATA */
  const [parts, setParts] = useState([]);
  const [selectedPartNo, setSelectedPartNo] = useState("");
  const [selectedPart, setSelectedPart] = useState(null);

  /* BOP MASTER DATA */
  const [bopsMaster, setBopsMaster] = useState([]);

  /* CONFIGURATION */
  const [bopRows, setBopRows] = useState([]);

  /* UI STATES */
  const [loadingParts, setLoadingParts] = useState(false);
  const [loadingBops, setLoadingBops] = useState(false);
  const [loadingConfiguration, setLoadingConfiguration] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  /* MODE */
  const [mode, setMode] = useState("view");

  /* REFS */
  const partSelectRef = useRef(null);
  const partTomSelectRef = useRef(null);

  // One TomSelect instance for each editable BOP FG Code row.
  const bopFgSelectRefs = useRef({});
  const bopFgTomSelectRefs = useRef({});
  const bopFgDropdownCleanupRefs = useRef({});

  /* LOAD PARTS */
  useEffect(() => {
    loadParts();
    loadBopMaster();
    return () => {
      if (partTomSelectRef.current) {
        try {
          partTomSelectRef.current.destroy();
        } catch {
          // ignore
        }
        partTomSelectRef.current = null;
      }
      Object.values(bopFgDropdownCleanupRefs.current).forEach((cleanup) => {
        try {
          cleanup?.();
        } catch {
          // ignore
        }
      });

      Object.values(bopFgTomSelectRefs.current).forEach((instance) => {
        try {
          instance?.destroy();
        } catch {
          // ignore
        }
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
        } catch {
          // Ignore focus errors when dropdown is being closed/destroyed.
        }
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
      /*
       * First position the dropdown, then focus the dedicated search input.
       * A second frame is used because Tom Select creates `.dropdown-input`
       * during dropdown rendering.
       */
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

  /*
  ============================================================
  TOM SELECT - PART NO.
  ============================================================
  */

  useEffect(() => {
    if (!partSelectRef.current || loadingParts) {
      return;
    }

    if (partTomSelectRef.current) {
      try {
        partTomSelectRef.current.destroy();
      } catch {
        // ignore
      }
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
        } catch {
          // ignore
        }
        partTomSelectRef.current = null;
      }
    };
  }, [parts, loadingParts]);

  /*
  ============================================================
  TOM SELECT - BOP FG CODE
  ============================================================
  */

  /*
   * Create the BOP FG Tom Select only when the number of rows changes.
   * DO NOT put the complete `bopRows` object in this dependency list.
   *
   * If we did, changing Supplier or Assembly Qty would destroy the
   * search control and recreate it, which is the exact problem seen
   * while typing/backspacing in the BOP FG search.
   */
  useEffect(() => {
    const activeIndexes = new Set(bopRows.map((_, index) => String(index)));

    /*
     * Remove instances belonging to deleted rows.
     */
    Object.entries(bopFgTomSelectRefs.current).forEach(([index, instance]) => {
      if (!activeIndexes.has(index) || mode === "view") {
        try {
          bopFgDropdownCleanupRefs.current[index]?.();
          instance?.destroy();
        } catch {
          // ignore
        }

        delete bopFgDropdownCleanupRefs.current[index];
        delete bopFgTomSelectRefs.current[index];
        delete bopFgSelectRefs.current[index];
      }
    });

    if (mode === "view" || loadingConfiguration || loadingBops) {
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

          /*
           * Dedicated search box INSIDE the dropdown.
           * This prevents Backspace from deleting/navigating the selected
           * BOP value in the main control.
           */
          dropdownInput: true,

          placeholder: "Search BOP FG Code",
          dropdownParent: document.body,

          /*
           * Keep the search behavior predictable while typing.
           */
          searchField: ["text"],
          openOnFocus: true,
          closeAfterSelect: true,
          selectOnTab: false,
          hideSelected: false,

          sortField: {
            field: "text",
            direction: "asc",
          },

          onInitialize: () => {
            /*
             * The original <select> is kept as the Tom Select source.
             * React should not fight Tom Select over its value after
             * initialization.
             */
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

  /*
  ============================================================
  SYNC BOP FG VALUES WITHOUT RECREATING TOM SELECT
  ============================================================
  */

  useEffect(() => {
    if (mode === "view") {
      return;
    }

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
  }, [bopRows, mode]);

  /* =====================================================
       LOAD PART MASTER
       ===================================================== */

  const loadParts = async () => {
    setLoadingParts(true);

    try {
      const response = await fetch(`${API_BASE_URL}/parts`);

      if (!response.ok) {
        throw new Error(`Failed to load parts (${response.status})`);
      }

      const result = await response.json();

      /*
            ------------------------------------------------
            SUPPORT DIFFERENT RESPONSE FORMATS
            ------------------------------------------------
            */

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

  /* =====================================================
       LOAD BOP MASTER
       ===================================================== */

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

  /* =====================================================
       PART SELECT
       ===================================================== */

  const handlePartChange = async (partNo) => {
    const value = String(partNo || "").trim();

    setSelectedPartNo(value);

    setMessage("");
    setMessageType("");

    /*
        ----------------------------------------------------
        CLEAR CURRENT DATA
        ----------------------------------------------------
        */

    setBopRows([]);

    setSelectedPart(null);

    /*
        ----------------------------------------------------
        FIND PART
        ----------------------------------------------------
        */

    const part =
      parts.find(
        (item) => String(item.part_no ?? item.partNo ?? "").trim() === value,
      ) || null;

    setSelectedPart(part);

    if (!value) {
      setMode("view");
      return;
    }

    /*
        ----------------------------------------------------
        LOAD SAVED BOP CONFIGURATION
        ----------------------------------------------------
        */

    await loadPartBopConfiguration(value);
  };

  /* =====================================================
       LOAD PART BOP CONFIGURATION
       ===================================================== */

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

      /*
                ------------------------------------------------
                NO EXISTING CONFIGURATION
                ------------------------------------------------
                */

      if (data.length === 0) {
        setBopRows([]);

        setMode("new");

        return;
      }

      /*
                ------------------------------------------------
                EXISTING CONFIGURATION
                ------------------------------------------------
                */

      const normalized = data.map(normalizeBopRow);

      /*
                ------------------------------------------------
                REBUILD SUPPLIER OPTIONS
                FROM MASTER BOP
                ------------------------------------------------
                */

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

      setMode("view");
    } catch (error) {
      console.error("LOAD PART BOP CONFIGURATION ERROR:", error);

      /*
                ------------------------------------------------
                If configuration does not exist,
                allow creating it.
                ------------------------------------------------
                */

      setBopRows([]);

      setMode("new");

      showMessage(
        error.message || "Failed to load BOP configuration.",
        "error",
      );
    } finally {
      setLoadingConfiguration(false);
    }
  };

  /* =====================================================
       GET SUPPLIER OPTIONS
       ===================================================== */

  const getSupplierOptions = (bop) => {
    if (!bop) {
      return [];
    }

    /*
        ----------------------------------------------------
        EXISTING API MAY RETURN SUPPLIER IDs
        AND SUPPLIER NAMES AS COMMA-SEPARATED VALUES
        ----------------------------------------------------
        */

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

  /* =====================================================
       SELECT BOP MASTER
       ===================================================== */

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

  /* =====================================================
       UPDATE NORMAL FIELD
       ===================================================== */

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

  /* =====================================================
       ADD BOP ROW
       ===================================================== */

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

  /* =====================================================
       DELETE BOP ROW
       ===================================================== */

  const deleteBopRow = (rowIndex) => {
    setBopRows((previous) => previous.filter((_, index) => index !== rowIndex));

    setMode("edit");
  };

  /* =====================================================
       START EDIT
       ===================================================== */

  const startEdit = () => {
    if (!selectedPartNo) {
      showMessage("Please select a Part No.", "error");

      return;
    }

    setMode("edit");

    setMessage("");
    setMessageType("");
  };

  /* =====================================================
       NEW CONFIGURATION
       ===================================================== */

  const startNewConfiguration = () => {
    if (!selectedPartNo) {
      showMessage("Please select a Part No. first.", "error");

      return;
    }

    setBopRows([createEmptyBop()]);

    setMode("edit");

    setMessage("");
    setMessageType("");
  };

  /* =====================================================
       CANCEL EDIT
       ===================================================== */

  const cancelEdit = async () => {
    if (!selectedPartNo) {
      return;
    }

    await loadPartBopConfiguration(selectedPartNo);
  };

  /* =====================================================
       VALIDATE
       ===================================================== */

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

    /*
        ----------------------------------------------------
        DUPLICATE BOP + SUPPLIER
        ----------------------------------------------------
        */

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

  /* =====================================================
       SAVE
       ===================================================== */

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
      /*
                ------------------------------------------------
                PREPARE DATA
                ------------------------------------------------
                */

      const payloadRows = bopRows.map((row) => ({
        bopId: Number(row.bopId),

        supplierId: Number(row.supplierId),

        assemblyQty: Number(row.assemblyQty),
      }));

      /*
                ------------------------------------------------
                SAVE

                If configuration already exists:
                    PUT

                Otherwise:
                    POST
                ------------------------------------------------
                */

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

      /*
                ------------------------------------------------
                SUCCESS
                ------------------------------------------------
                */

      showMessage(
        result.message || "BOP configuration saved successfully.",
        "success",
      );

      /*
                ------------------------------------------------
                RELOAD FROM DATABASE
                ------------------------------------------------
                */

      await loadPartBopConfiguration(selectedPartNo);
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

  /* =====================================================
       CLEAR CONFIGURATION
       ===================================================== */

  const clearConfiguration = async () => {
    if (!selectedPartNo) {
      return;
    }

    const confirmed = window.confirm(
      `Delete all BOP configuration for Part No. ${selectedPartNo}?`,
    );

    if (!confirmed) {
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/part-bops/${encodeURIComponent(selectedPartNo)}`,
        {
          method: "DELETE",
        },
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message || "Failed to delete BOP configuration.",
        );
      }

      setBopRows([]);

      setMode("new");

      showMessage(
        result.message || "BOP configuration deleted successfully.",
        "success",
      );
    } catch (error) {
      console.error("DELETE BOP CONFIGURATION ERROR:", error);

      showMessage(
        error.message || "Failed to delete BOP configuration.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  /* =====================================================
       MESSAGE
       ===================================================== */

  const showMessage = (text, type = "info") => {
    setMessage(text);
    setMessageType(type);
  };

  /* =====================================================
       PART DETAILS
       ===================================================== */

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

  /* =====================================================
       TOTAL ASSEMBLY QTY
       ===================================================== */

  const totalAssemblyQty = bopRows.reduce(
    (total, row) => total + (Number(row.assemblyQty) || 0),
    0,
  );

  /* =====================================================
       RENDER
       ===================================================== */

  return (
    <div className="bop-management">
      {/* =================================================
                MESSAGE
            ================================================= */}

      {message && (
        <div className={`bop-management-message ${messageType}`}>{message}</div>
      )}

      {/* =================================================
                PART SELECTOR
            ================================================= */}

      <div className="bop-management-selector">
        <h3 className="bop-management-selector-title">BOP Management</h3>

        <div className="bop-management-selector-row">
          <div className="bop-management-field">
            <label>Part No.</label>

            <select
              ref={partSelectRef}
              className="bop-part-select"
              value={selectedPartNo}
              disabled={loadingParts}
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
                  <option key={part.id ?? `${partNo}-${index}`} value={partNo}>
                    {partNo}
                    {part.part_name ? ` - ${part.part_name}` : ""}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* =================================================
                PART INFORMATION
            ================================================= */}

      {selectedPartNo && (
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
      )}

      {/* =================================================
                BOP CONTENT
            ================================================= */}

      {selectedPartNo && (
        <div className="bop-management-content">
          {/* =========================================
                        CONTENT HEADER
                    ========================================= */}

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
              {mode === "view" && (
                <>
                  <button
                    type="button"
                    className="bop-btn bop-btn-update"
                    onClick={startEdit}
                    disabled={saving || loadingConfiguration}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="bop-btn bop-btn-delete"
                    onClick={clearConfiguration}
                    disabled={
                      saving || loadingConfiguration || bopRows.length === 0
                    }
                  >
                    Delete
                  </button>
                </>
              )}

              {mode !== "view" && (
                <>
                  <button
                    type="button"
                    className="bop-btn bop-btn-add"
                    onClick={addBopRow}
                    disabled={saving}
                  >
                    + Add BOP
                  </button>

                  <button
                    type="button"
                    className="bop-btn bop-btn-save"
                    onClick={saveConfiguration}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Configuration"}
                  </button>

                  <button
                    type="button"
                    className="bop-btn bop-btn-cancel"
                    onClick={cancelEdit}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>

          {/* =========================================
                        LOADING
                    ========================================= */}

          {loadingConfiguration ? (
            <div className="bop-management-loading">
              <span className="bop-loading-spinner" />
              Loading BOP configuration...
            </div>
          ) : bopRows.length === 0 ? (
            /* =====================================
                           EMPTY STATE
                        ===================================== */

            <div className="bop-management-empty">
              <div className="bop-management-empty-icon">+</div>

              <h3 className="bop-management-empty-title">
                No BOP Configuration
              </h3>

              <p className="bop-management-empty-text">
                No BOP components are currently configured for this Part No.
              </p>

              <div
                style={{
                  marginTop: "18px",
                }}
              >
                <button
                  type="button"
                  className="bop-btn bop-btn-add"
                  onClick={startNewConfiguration}
                  disabled={saving || loadingBops}
                >
                  + Add BOP
                </button>
              </div>
            </div>
          ) : (
            /* =====================================
                           TABLE
                        ===================================== */

            <div className="bop-table-wrapper">
              <table className="bop-management-table">
                <thead>
                  <tr>
                    <th className="sr-no">Sr. No.</th>

                    <th>BOP FG Code</th>

                    <th>BOP Part No.</th>

                    <th>Part Name</th>

                    <th>Supplier Name</th>

                    <th>Commodity</th>

                    <th>Assembly Qty</th>

                    {mode !== "view" && (
                      <th className="action-column">Action</th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {bopRows.map((row, rowIndex) => {
                    const supplierOptions = row.suppliers || [];

                    return (
                      <tr key={row.id ?? `new-${rowIndex}`}>
                        {/* =================================
                                                        SR NO
                                                    ================================= */}

                        <td className="sr-no">{rowIndex + 1}</td>

                        {/* =================================
                                                        BOP FG CODE
                                                    ================================= */}

                        <td>
                          {mode === "view" ? (
                            <span>{row.bopFgCode}</span>
                          ) : (
                            <select
                              ref={(element) => {
                                bopFgSelectRefs.current[rowIndex] = element;
                              }}
                              className="bop-fg-code"
                              value={row.bopId || ""}
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
                          )}
                        </td>

                        {/* =================================
                                                        BOP PART NO
                                                    ================================= */}

                        <td>
                          <span className="bop-part-no">
                            {row.bopPartNo || "-"}
                          </span>
                        </td>

                        {/* =================================
                                                        PART NAME
                                                    ================================= */}

                        <td>
                          <span className="bop-part-name">
                            {row.bopPartName || "-"}
                          </span>
                        </td>

                        {/* =================================
                                                        SUPPLIER
                                                    ================================= */}

                        <td>
                          {mode === "view" ? (
                            <span>
                              {supplierOptions.find(
                                (supplier) =>
                                  String(supplier.id) ===
                                  String(row.supplierId),
                              )?.name ||
                                row.supplierName ||
                                "-"}
                            </span>
                          ) : (
                            <select
                              className="bop-supplier"
                              value={row.supplierId || ""}
                              disabled={!row.bopId || saving}
                              onChange={(event) =>
                                handleRowChange(
                                  rowIndex,
                                  "supplierId",
                                  event.target.value,
                                )
                              }
                            >
                              <option value="">Select Supplier</option>

                              {supplierOptions.map((supplier, index) => (
                                <option
                                  key={supplier.id ?? index}
                                  value={supplier.id}
                                >
                                  {supplier.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>

                        {/* =================================
                                                        COMMODITY
                                                    ================================= */}

                        <td>
                          <span className="bop-commodity">
                            {row.commodity || "-"}
                          </span>
                        </td>

                        {/* =================================
                                                        ASSEMBLY QTY
                                                    ================================= */}

                        <td>
                          {mode === "view" ? (
                            <span className="bop-assembly-qty">
                              {Number(row.assemblyQty || 0).toLocaleString(
                                "en-IN",
                                {
                                  maximumFractionDigits: 4,
                                },
                              )}
                            </span>
                          ) : (
                            <input
                              className="bop-assembly-qty"
                              type="number"
                              min="0"
                              step="0.0001"
                              value={row.assemblyQty ?? ""}
                              disabled={saving}
                              onChange={(event) =>
                                handleRowChange(
                                  rowIndex,
                                  "assemblyQty",
                                  event.target.value,
                                )
                              }
                            />
                          )}
                        </td>

                        {/* =================================
                                                        ACTION
                                                    ================================= */}

                        {mode !== "view" && (
                          <td className="action-column">
                            <button
                              type="button"
                              className="bop-row-delete"
                              title="Delete row"
                              onClick={() => deleteBopRow(rowIndex)}
                              disabled={saving}
                            >
                              ×
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* =========================================
                        FOOTER
                    ========================================= */}

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
      )}
    </div>
  );
};

export default BopManagement;
