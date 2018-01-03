class Main {
  constructor() {
    this.dataSvc = new DataService();
    this.matriculeToSubmit = null;
    this.listenForSubmit();
    this.searchByNomEvent();
    this.dataSvc
      .getCollabs()
      .then(this.populateTable)
      .then(() => this.registerClickRowEvent(this));
  }

  searchByNomEvent() {
    $('#searchbynom').keyup(function(event) {
      let text = $(this)
        .val()
        .toLowerCase();
      let names = $('tbody tr')
        .map(function() {
          return {
            id: $(this).attr('id'),
            name: $(this)
              .find('td#nom')
              .text()
          };
        })
        .get()
        .forEach(val => {
          //console.log(text, val.id, val.name, val.name.includes(text));
          if (val.name.toLowerCase().includes(text)) {
            $('tr#' + val.id).show();
          } else {
            $('tr#' + val.id).hide();
          }
        });
    });
  }

  populateTable(collabs) {
    let rows = '';
    collabs.forEach((element, i) => {
      rows +=
        '<tr id="' +
        i +
        '"><td id="matricule">' +
        element.matricule +
        '</td><td id="nom">' +
        element.nom +
        '</td><td id="prenom">' +
        element.prenom +
        '</td></tr>';
    });
    $('table tbody').append(rows);
    return Promise.resolve();
  }

  registerClickRowEvent(self) {
    $('table tbody tr').click(function() {
      let matricule = $(this)
        .find('td#matricule')
        .text();
      console.log('clicked : ', matricule);
      self.matriculeToSubmit = matricule;
      self.dataSvc.getCollabByMatricule(matricule).then(
        banqueInfo => {
          console.log(banqueInfo);
          self.populateForm(banqueInfo);
          self.highlightRow(this);
        },
        err => {
          console.log(err);
        }
      );
    });
  }

  highlightRow(elem) {
    var selected = $(elem).hasClass('highlight');
    if (!selected) {
      $('table tbody tr').removeClass('highlight');
      $(elem).addClass('highlight');
    }
  }

  listenForSubmit() {
    let self = this;
    $('form#banqueForm')
      .find('button[type=submit]')
      .click(function(e) {
        e.preventDefault();
        let formData = getFormObj(),
          matricule = self.matriculeToSubmit;
        console.log(formData);
        self.dataSvc.putBanqueInfo(matricule, formData, function(resp) {
          if (resp) {
            alert(
              'Les coordonnées banquaire du collaborateur ' +
                matricule +
                ' ont bien été enregistrées'
            );
          } else {
            alert(
              'Une erreur est survenue en essayant de modifier les coordonnées banquaire du collaborateur ' +
                matricule
            );
          }
        });
      });
  }

  populateForm(banqueInfo) {
    let form = $('form#banqueForm');
    form.find('input#matricule').val(this.matriculeToSubmit);
    form.find('input#bic').val(banqueInfo.bic);
    form.find('input#banque').val(banqueInfo.banque);
    form.find('input#iban').val(banqueInfo.iban);
    form.find('button[type=submit]').prop('disabled', false);
    console.log('form poupulated', getFormObj());
  }
}

class DataService {
  constructor() {
    this.endpoint = 'http://localhost:8080/api/';
  }

  getCollabs() {
    return $.get(this.endpoint + 'collaborateurs');
  }

  getCollabByMatricule(matricule) {
    return $.get(this.endpoint + 'collaborateurs/' + matricule + '/banque/');
  }

  putBanqueInfo(matricule, banqueInfo, callback) {
    return $.put(
      this.endpoint + 'collaborateurs/' + matricule + '/banque/',
      banqueInfo,
      callback
    );
  }
}

$.put = function(url, data, callback) {
  return $.ajax({
    url: url,
    type: 'PUT',
    success: callback,
    data: JSON.stringify(data),
    contentType: 'application/json'
  });
};

function getFormObj() {
  let formObj = {};
  let inputs = $('form#banqueForm').serializeArray();
  $.each(inputs, function(i, input) {
    formObj[input.name] = input.value;
  });
  return formObj;
}

new Main();
