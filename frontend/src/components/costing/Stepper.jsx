import "../../assets/css/components/Stepper.css";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

const steps = ["Part Details", "RM Details", "Process Details", "Bottom Line"];

function Stepper({ currentStep }) {
  const navigate = useNavigate();

  return (
    <div className="card mb-2 costing-stepper-card">
      <div className="card-body">
        <div className="stepper">
          {steps.map((step, index) => {
            const stepNumber = index + 1;

            return (
              <div className="step-item" key={step}>
                <div
                  className={`step-circle
                    ${stepNumber === currentStep ? "active" : ""}
                    ${stepNumber < currentStep ? "completed" : ""}
                  `}
                >
                  {stepNumber}
                </div>

                <div className="step-title">{step}</div>

                {index !== steps.length - 1 && (
                  <div
                    className={`step-line ${
                      stepNumber < currentStep ? "completed" : ""
                    }`}
                  />
                )}
              </div>
            );
          })}

          {/* Back button after Bottom Line */}
          <button
            type="button"
            className="wizard-back-btn"
            onClick={() => navigate("/molding")}
          >
            <ChevronLeft size={16} />
            Back
          </button>
        </div>
      </div>
    </div>
  );
}

export default Stepper;
