// Licensed to the.NET Foundation under one or more agreements.
// The.NET Foundation licenses this file to you under the MIT license.

using System.Diagnostics.CodeAnalysis;
using EtsCoreTests;
using Xunit.Sdk;
using Xunit.v3;

[assembly: TestPipelineStartup(typeof(CoreStartup))]

namespace EtsCoreTests;

[SuppressMessage("Maintainability", "CA1515:Consider making public types internal")]
public class CoreStartup : ITestPipelineStartup
{
    public ValueTask StartAsync(IMessageSink diagnosticMessageSink)
    {
        return ValueTask.CompletedTask;
    }

    public ValueTask StopAsync()
    {
        return ValueTask.CompletedTask;
    }
}
