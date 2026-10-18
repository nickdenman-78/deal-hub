namespace Ets.Core.Domain;

public static class LogEventIds
{
    public const int CommandProcessing = 1000;
    public const int QueryProcessing = 1001;

    public const int CommandProcessed = 1010;
    public const int QueryProcessed = 1011;

    public const int CommandFailed = 1020;
    public const int QueryFailed = 1021;
}
