using Ets.Core.Domain.ValueObjects;

namespace EtsCoreTests.ValueObjects;

public sealed class PhoneAndBusinessNumberTests
{
    public static TheoryData<string, string, bool> PhoneNumbers => new()
    {
        { "07 3000 1234", "0730001234", true },
        { "+61 7 3000 1234", "0730001234", true },
        { "0412-345-678", "0412345678", true },
        { "(02) 9876 5432", "0298765432", true },
        { "1300 123 456", "1300123456", true },
        { "13 12 34", "131234", true },
        { "0912 345 678", "0912345678", false },
        { "12345", "12345", false }
    };

    [Theory]
    [MemberData(nameof(PhoneNumbers))]
    public void PhoneNumber_IsNormalised_AndChecked(string input, string expected, bool isValid)
    {
        var phone = PhoneNumber.Create(input);

        phone.Value.ShouldBe(expected);
        phone.IsValid.ShouldBe(isValid);
    }

    [Theory]
    [InlineData("51 824 753 556", true, "51 824 753 556")]
    [InlineData("51824753556", true, "51 824 753 556")]
    [InlineData("51 824 753 557", false, "51824753557")]
    [InlineData("1234", false, "1234")]
    public void ABN_IsCheckedWithTheAbrChecksum(string input, bool isValid, string formatted)
    {
        var abn = ABN.Create(input);

        abn.IsValid.ShouldBe(isValid);
        abn.ToString().ShouldBe(formatted);
    }

    [Theory]
    [InlineData("004 085 616", true, "004 085 616")]
    [InlineData("000-000-019", true, "000 000 019")]
    [InlineData("004 085 617", false, "004085617")]
    public void ACN_IsCheckedWithTheAsicCheckDigit(string input, bool isValid, string formatted)
    {
        var acn = ACN.Create(input);

        acn.IsValid.ShouldBe(isValid);
        acn.ToString().ShouldBe(formatted);
    }
}
