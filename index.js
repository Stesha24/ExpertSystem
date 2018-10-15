var control_file = $('#fileInput');
var resetBtn = $('#resetBtn');
var hypoParsed;
var hypoSorted;
var featuresParsed;
var countFeatures = 0;

/*Сброс*/
resetBtn.click(function(){
  $('.file_titles').empty();
  $('.file_features').empty();
  $('.file_hypotheses').empty();
  $('.questions').empty();
  $('#fileInput').prop('disabled', false);
  $('#fileInput').val('');
  $('.file_status').empty();
  $('.upload').css('display', 'block');
  $('.container').css('display', 'none');
  $('#consultation_start').css('display', 'inline-block');
  $('.consultation_process').css('display', 'none');
});

/*Отслеживание загрузки файла*/
control_file.change(function(){
  var file = control_file[0].files[0];
  var ext = file.name.split('.').pop();

  if (ext != 'mkb') {
    $('.file_status').empty();
    $('.file_status').append('Файл должен быть mkb! Файл не загружен!')
  } else {
    $('#fileInput').prop('disabled', true);
    $('.container').css('display', 'block');
    $('.file_status').empty();
    $('.upload').css('display', 'none');
    $('.file_status').append('Файл загружен!');

    var reader = new FileReader;
    reader.readAsText(file, 'utf-8');
    reader.onloadend = function (evt) {
      var file_content = reader.result;
      parseMkb(file_content);
    };
  }
});

/*Парсер заголовка и признаков*/
function parseMkb(file_content) {
  var titles = [];
  features = [];
  function featuresObject(number, name) {
    this.number = number;
    this.name = name;
  };
  var hypotheses = [];
  var numberOfFeatures;
  var content_strings = file_content.split('\n');
  var counterTypes = 0;
  for (var i = 0; i < content_strings.length; i++) {
    if (content_strings[i].length == 1) {
      counterTypes++;
      continue;
    }
    if(counterTypes == 1) {
      features.push(content_strings[i]);
    } else if (counterTypes == 2) {
      hypotheses.push(content_strings[i]);
    } else {
      titles.push(content_strings[i]);
    }
  }
  numberOfFeatures = features.length - 1;
  viewTitle(titles, 'titles');
  featuresIntoObject(features);
  viewFeatures(featuresParsed);
  parserHypo(hypotheses, numberOfFeatures);
  viewHypotheses();
}

function featuresIntoObject (elem) {
  featuresParsed = [];
  function featureObject(number, name) {
    this.number = number;
    this.name = name;
  };

  for (var i = 0; i < elem.length; i++) {
    var helpObject = new featureObject();
    helpObject.number = i + "";
    helpObject.name = elem[i];
    featuresParsed.push(helpObject);
  }
}

/*Парсер гипотез в объект*/
function parserHypo (hypotheses) {
  hypoParsed = [];
  function hypoObject(name, aprior) {
    this.name = name;
    this.aprior = aprior;
    this.values = values;
  };
    for (var i = 0; i < hypotheses.length; i++) {
      var helpArray = hypotheses[i].split(',');
      var checkNumber = 1;
      var helpArray2 = hypotheses[i].split(',');
      helpArray2.shift();
      helpArray2.shift();
      var values = [];
      var k = 0;
      for (var j = 0; j < helpArray2.length; j+=3) {
        values[k] = {'first': helpArray2[j], 'second': helpArray2[j+1], 'third': helpArray2[j+2]};
        //console.log(values[k]);
        k++;
      }
      //console.log(values);
      var helpObject = new hypoObject(helpArray[0], helpArray[1], values);
      hypoParsed.push(helpObject);
    }
}

/*Отображение заголовка*/
function viewTitle(elem, elemName) {
  for (var i = 0; i < elem.length; i++) {
    $('.file_'+elemName).append('<p class="elem">' + elem[i] + '</p>');
  }
}

function viewFeatures (elem) {
  for (var i = 0; i < elem.length; i++) {
    $('.file_features').append('<p class="feature">' + elem[i].name + '</p>');
  }
}

/*Отображение гипотез и текущей априорной вероятности*/
function viewHypotheses() {
  $('.file_hypotheses').empty();
  for (var i = 0; i < hypoParsed.length; i++) {
    var pApr = hypoParsed[i].aprior;
    pApr = +pApr;
    $('.file_hypotheses').append('<div class=hypotheses><p class="aprior">' + pApr.toFixed(5) + '</p>' +
      '<p class=hypo_name>' + hypoParsed[i].name + '</p></div>');
  }
}

/*Нажатие кнопки старт (начало консультации)*/
$('#consultation_start').click(function (){
  $('#consultation_start').css("display", "none");
  $('.consultation_process').css("display", "inline-block");
  outQuestion();
});

/*Вывод вопроса*/
function outQuestion() {
    $('.questions').append(featuresParsed[countFeatures+1].name + '<br>');
}

/*Нажатие кнопки ОК*/
$('#input_ok').click(function() {
  if (countFeatures == featuresParsed.length-2) {
    countFeatures++;
    recalcProb(countFeatures);
    $('#consultation_start').css('display', 'inline-block');
    $('.consultation_process').css('display', 'none');
    alert("Консультация окончена");
    countFeatures = 0;
    return;
  }
  countFeatures++;
  recalcProb(countFeatures);
  console.log("counterFeatures" + countFeatures);
  outQuestion();
})

/*Пересчет априорных вероятностей*/
function recalcProb(features_number) {
  var answer = $('#input_prob').val();
  console.log(answer);
  var min = 0;
  var max = 1;
  var avg = 0.5;
  if (answer < 0.5) {
    for (var i = 0; i < hypoParsed.length; i++) {
      if (hypoParsed[i].values[features_number-1] === undefined) {
        continue;
      }
      var pPlus = hypoParsed[i].values[features_number-1].second;
      var pMinus = hypoParsed[i].values[features_number-1].third;
      var pApr = hypoParsed[i].aprior;
      console.log("p+ = " + pPlus + "  p- = " + pMinus + "  pApr = " + pApr);
      var pHnotE = ((1 - pPlus) * pApr) / ((1 - pPlus) * pApr + (1 - pMinus) * (1 - pApr));
      hypoParsed[i].aprior = pHnotE + ((answer - min) * (pApr - pHnotE)) / (avg - min);
    }

  } else if (answer >= 0.5) {
    for (var i = 0; i < hypoParsed.length; i++) {
      if (hypoParsed[i].values[features_number-1] === undefined) {
        continue;
      }
      var pPlus = +hypoParsed[i].values[features_number-1].second;
      var pMinus = +hypoParsed[i].values[features_number-1].third;
      var pApr = +hypoParsed[i].aprior;
      console.log("p+ = " + pPlus + "  p- = " + pMinus + "  pApr = " + pApr);
      var pHE = +(pPlus * pApr) / (pPlus * pApr + pMinus * (1 - pApr));
      hypoParsed[i].aprior = pApr + ((answer - avg) * (pHE - pApr)) / (max - avg);
    }
  } else {
    alert("Введено неверное значение!");
  }
  sortHypotheses();
}

function sortHypotheses () {
  hypoSorted = hypoParsed;
  hypoSorted.sort(compareAprior);
  viewHypotheses();
}

function compareAprior (elem1, elem2) {
  return elem2.aprior - elem1.aprior;
}
