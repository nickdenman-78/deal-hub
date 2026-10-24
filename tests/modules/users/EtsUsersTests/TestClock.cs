using Ets.Core.Application.Services;
using Ets.Core.Domain.Services;

namespace EtsUsersTests;

internal static class TestClock
{
    public static readonly DateTimeOffset Now = new(2026, 10, 24, 9, 0, 0, TimeSpan.FromHours(10));

    public static IDateTimeProvider Frozen { get; } = new FrozenDateTimeProvider(Now);
}
