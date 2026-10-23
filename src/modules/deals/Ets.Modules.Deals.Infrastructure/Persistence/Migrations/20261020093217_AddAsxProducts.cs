using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ets.Modules.Deals.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
public partial class AddAsxProducts : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.EnsureSchema(
            name: "deals");

        migrationBuilder.CreateTable(
            name: "asx_products",
            schema: "deals",
            columns: table => new
            {
                product_code = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: false),
                number_of_days = table.Column<int>(type: "integer", nullable: false),
                contract_size = table.Column<decimal>(type: "numeric(18,6)", nullable: false),
                date_created = table.Column<DateTimeOffset>(type: "timestamptz", nullable: true, defaultValueSql: "now()"),
                created_by = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                date_modified = table.Column<DateTimeOffset>(type: "timestamptz", nullable: true),
                modified_by = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_asx_products", x => x.product_code);
            });
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "asx_products",
            schema: "deals");
    }
}
