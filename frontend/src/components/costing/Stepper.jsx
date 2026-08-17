import "../../assets/css/Stepper.css";

const steps = [
  "Part Details",
  "RM Details",
  "Process Details",
  "Bottom Line",
  "Outsourcing"
];

function Stepper({ currentStep }) {
  return (
    <div className="card mb-2" style={{height: "45px", fontWeight: "700"}}>
      <div className="card-body">

        <div className="stepper">

  {steps.map((step, index) => {
    const stepNumber = index + 1;

    return (
      <div className="step-item" key={step} >

        <div
          className={`step-circle
            ${stepNumber === currentStep ? "active" : ""}
            ${stepNumber < currentStep ? "completed" : ""}
          `}
        >
          {stepNumber}
        </div>

        <div className="step-title">
          {step}
        </div>

        {index !== steps.length - 1 && (
          <div
            className={`step-line ${
              stepNumber < currentStep ? "completed" : ""
            }`}
          ></div>
        )}

      </div>
    );
  })}

</div>

      </div>
    </div>
  );
}

export default Stepper;