import { Helmet } from "react-helmet-async";

function Header({
  title = "ZBC Costing",
  description = "ZBC Costing Admin Panel",
}) {
  return (
    <Helmet>
      <title>{title}</title>

      <meta charSet="UTF-8" />

      <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
      />

      <meta
        name="description"
        content={description}
      />

      <meta
        name="theme-color"
        content="#15243a"
      />

      <link
        rel="icon"
        href="../../assets/images/favicon.ico"
      />
    </Helmet>
  );
}

export default Header;