$(document).ready(function () {
  let chart;
  let currentCustomerId = null;

  fetch('./Data.json')
  .then(response => response.json())
  .then(data => {

    const customers = data.customers;
    const transactions = data.transactions;

    const customerTransactions = transactions.reduce((acses, transaction) => {
      const customerId = transaction.customer_id;
      acses[customerId] = acses[customerId] || [];
      acses[customerId].push(transaction);
      return acses;
    }, {});

    const tbody = document.querySelector('.table tbody');
    let tableRows = tbody.querySelectorAll('tr');

    //  إنشاء صف لكل عميل في الجدول وعرضه
    customers.forEach((customer, index) => {
      const customerTransactionsData = customerTransactions[customer.id] || [];
      let totalTransactionAmount = customerTransactionsData.reduce(
        (sum, transaction) => sum + transaction.amount,
        0 // inchal value for totalTransactionAmount
      );

      const row = document.createElement('tr');

      if (index % 2 === 0) {
        row.classList.add('table-active');
      }

      row.innerHTML = `
        <td>${customer.name}</td>
        <td>${totalTransactionAmount}</td>
        <td>
          <button type="button" class="btn btn-outline-primary view-details" data-customer-id="${customer.id}" data-customer-name="${customer.name}">View</button>
        </td>
      `;

      tbody.appendChild(row);
    });

    //   عرض بيانات عميل محدد في الرسم البياني
    function showCustomerDataOnChart(customerId) {
      if (customerId === currentCustomerId) return;
      currentCustomerId = customerId;

      const customer = customers.find(c => c.id === customerId);
      if (!customer) return;

      const customerData = customerTransactions[customerId] || [];
      const chartData = customerData.map(transaction => ({
        x: new Date(transaction.date + ' 12:00:00').getTime(),
        y: transaction.amount
      }));

      //  إضافة  class  لبدء الانتقال
      const chartContainer = document.getElementById('chartContainer');
      chartContainer.classList.add('fading');


      //  إنشاء أو تحديث الرسم البياني
      if (!chart) {
        chart = new CanvasJS.Chart("chartContainer", {
          animationEnabled: true,
          title: {
            text: "Transaction Details for " + customer.name
          },
          axisX: {
            valueFormatString: "DD MMM",
            title: "Time"
          },
          axisY: {
            title: "Amount",
            includeZero: true
          },
          data: [{
            type: "line",
            name: "Transaction Amount",
            connectNullData: true,
            xValueType: "dateTime",
            xValueFormatString: "DD MMM",
            yValueFormatString: "#,##0",
            dataPoints: chartData
          }]
        });
      } else {
        chart.options.title.text = "Transaction Details for " + customer.name;
        chart.options.data[0].dataPoints = chartData;
      }

      chart.render();

      //  إزالة  class  بعد اكتمال  rendering  لإظهار الرسم البياني
      setTimeout(() => {
        chartContainer.classList.remove('fading');
      }, 0);
    }

    //  عرض بيانات العميل رقم 1  "by default"
    showCustomerDataOnChart(1);

    //  تحديث الرسم البياني wine click to button "View"
    tbody.addEventListener('click', (event) => {
      if (event.target.classList.contains('view-details')) {
        const customerId = parseInt(event.target.dataset.customerId);
        showCustomerDataOnChart(customerId);
      }
    });


    function search(e) {
      const customerFilter = e.target.value.toLowerCase();
      const tableBody = document.querySelector("tbody");
      // let chartContainer = document.getElementById("chartContainer");
      let notFoundMessage = document.querySelector("#noResults");
      tableBody.innerHTML = "";

      let matchedRow = null;
      let matchCount = 0;

      customers.forEach((customer, index) => {
        const row = document.createElement("tr");
        if (index % 2 === 0) {
          row.classList.add("table-active");
        }

        //  التحقق من التطابق  قبل  إضافة الصف 
        if (customer.name.toLowerCase().includes(customerFilter)) {
          matchCount++;
          matchedRow = row;

          //  حساب  Total Transaction Amount  هنا  (بعد التحقق من التطابق)
          const customerTransactionsData = transactions.filter(transaction => transaction.customer_id === customer.id);
          let totalTransactionAmount = customerTransactionsData.reduce(
            (sum, transaction) => sum + transaction.amount,
            0 // inchal value for totalTransactionAmount
          );

          row.innerHTML = `
            <td>${customer.name}</td>
            <td>${totalTransactionAmount}</td> 
            <td class="p-3"><button type="button" class="btn btn-outline-primary view-details" data-customer-id="${customer.id}">View</button></td>
          `;
          tableBody.appendChild(row); 
        } 
      });

      //  التعامل مع حالات تطابق
      if (matchCount === 1) {
        //  تطابق واحد 
        const firstVisibleCustomerId = parseInt(matchedRow.querySelector(".view-details").dataset.customerId);
        showCustomerDataOnChart(firstVisibleCustomerId);
        chartContainer.classList.remove('d-none');
        notFoundMessage.classList.add("d-none");
      }
      else if (matchCount === 0) {//  لا يوجد تطابق
        notFoundMessage.classList.remove("d-none");
        notFoundMessage.classList.add("d-block");
        chartContainer.classList.add('d-none');
      } 
      else {
        //  أكثر من تطابق
        // $("#chartContainer").html("<p class='text-center fs-2'>Please click on View to show transactions graph.</p>"); 
        chartContainer.classList.remove('d-none');
        notFoundMessage.classList.add("d-none");
      }
    }

      $("#floatingInputGroup1").on("keyup", function (event) {
        if (event.key === "Enter") {
          search(event);
        }
      });

      $(".input-group-text").on("click", function() {
        search({ target: { value: $("#floatingInputGroup1").val() } }); //  تمرير قيمة  input  بشكل صريح
      });
  })
  .catch(error =>  document.html(`<p class='text-center fs-2'>${error}</p>`));
});
