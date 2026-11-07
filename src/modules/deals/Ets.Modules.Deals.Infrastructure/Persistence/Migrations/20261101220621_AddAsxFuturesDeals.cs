using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ets.Modules.Deals.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
public partial class AddAsxFuturesDeals : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "asx_futures_deals",
            schema: "deals",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                version = table.Column<long>(type: "bigint", nullable: false),
                product_code = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: false),
                region = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false),
                load_profile = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                payoff = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                period = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                term = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                term_start = table.Column<DateOnly>(type: "date", nullable: false),
                term_end = table.Column<DateOnly>(type: "date", nullable: false),
                contract_days = table.Column<int>(type: "integer", nullable: false),
                contract_size = table.Column<decimal>(type: "numeric(18,6)", nullable: false),
                direction = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false),
                price = table.Column<decimal>(type: "numeric(18,6)", nullable: false),
                volume = table.Column<decimal>(type: "numeric(18,6)", nullable: false),
                contracted_energy = table.Column<decimal>(type: "numeric(18,6)", nullable: false),
                captured_at = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_asx_futures_deals", x => x.id);
            });

        migrationBuilder.CreateIndex(
            name: "ix_asx_futures_deals_captured_at",
            schema: "deals",
            table: "asx_futures_deals",
            column: "captured_at");

        migrationBuilder.CreateIndex(
            name: "ix_asx_futures_deals_product_code",
            schema: "deals",
            table: "asx_futures_deals",
            column: "product_code");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "asx_futures_deals",
            schema: "deals");
    }
}
