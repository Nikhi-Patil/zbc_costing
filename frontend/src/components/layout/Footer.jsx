import "../../assets/css/Footer.css";
function Footer() {
  return (
    <footer className="footer">

      <p>
        © {new Date().getFullYear()} <strong>Jayashree Polymers.</strong>
        {" "}All Rights Reserved.{" "}
        Developed by{" "}
        <a
          href="https://www.jayashreepolymers.com/"
          target="_blank"
          rel="noreferrer"
        >
          Jayashree Polymers Pvt. Ltd.
        </a>
      </p>

    </footer>
  );
}

export default Footer;