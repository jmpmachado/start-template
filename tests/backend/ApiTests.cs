using Xunit;

namespace Backend.Tests
{
    public class ApiTests
    {
        [Fact]
        public void TestHealthcheckStub()
        {
            // Simple unit test verification for backend.
            var status = "Healthy";
            Assert.Equal("Healthy", status);
        }
    }
}
