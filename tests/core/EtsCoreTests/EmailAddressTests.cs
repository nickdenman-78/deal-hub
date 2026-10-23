using Ets.Core.Domain.ValueObjects;

namespace EtsCoreTests;

public class EmailAddressTests(ITestOutputHelper output)
{
    [Theory]
    [InlineData(null, null, false, false)]
    [InlineData("", "", false, false)]
    [InlineData("a", "", false, true)]
    [InlineData("a@b", "a@b", true, false)]
    [InlineData("John.Smith@stanwell.com", "john.smith@stanwell.com", true, false)]
    public void Verify_EmailAddress(string? input, string? expected, bool isValid, bool shouldThrow)
    {
        if (shouldThrow)
        {
            Assert.Throws<ArgumentException>(() => EmailAddress.Create(input));
        }
        else
        {
            var actual = EmailAddress.Create(input);
            output.WriteLine($"Testing email: {input} -Expected: {expected} -Result: {actual} -Outcome: {isValid}");

            Assert.Equal(expected, actual.Value);
            Assert.Equal(isValid, actual.IsValid);
        }
    }
}
