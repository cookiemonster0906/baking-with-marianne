function LabelsFactory(data) {
  var data = new LabelsData(data);

  data.main().checkForMatchingRegularLabel(data.regular().list);

  this.create = function() {
    return new Labels(mainLabels().concat(regularLabels()));

    function mainLabels() {
      return R.map(mainLabel, mainLabelsData());
    }

    function mainLabelsData() {
      return data.main()
        .withMatchesIn(data.regular().withoutDuplicates().list)
        .adoptUrlFromMatchingLabel(data.regular().withoutDuplicates().list).list;
    }

    function mainLabel(data) {
      return new MainLabel(data.name, data.url);
    }

    function regularLabels() {
      return R.map(regularLabel, regularLabelsData());
    }

    function regularLabelsData() {
      return data.regular()
        .withoutDuplicates()
        .withoutMatchesIn(mainLabelsData()).list;
    }

    function regularLabel(data) {
      return new RegularLabel(data.name, data.url);
    }
  };
}


function LabelsData(list) {
  var markedAsMainLabel = function(label) {
    return MainLabel.prototype.markedAsMainLabel(label.name);
  };

  this.list = list;

  this.main = function() {
    return new MainLabelsData(R.filter(markedAsMainLabel, list));
  };

  this.regular = function() {
    return new RegularLabelsData(R.filter(R.compose(R.not, markedAsMainLabel), list));
  };
}

LabelsData.prototype.match = function(mainLabel, regularLabel) {
  return MainLabel.prototype.trim(mainLabel.name.toLowerCase()) == regularLabel.name.toLowerCase();
};


function RegularLabelsData(list) {
  this.list = list;

  this.withoutDuplicates = function() {
    return new RegularLabelsData(R.filter(R.compose(R.not, isDuplicate), list));

    function isDuplicate(label) {
      return label.name == tr(label.name) &&
        R.any(R.curry(hasSameNameOnlyInTranslation)(label.name), list);
    }

    function hasSameNameOnlyInTranslation(name, label) {
      return R.propSatisfies(x => tr(x) == name && x != tr(x), 'name', label);
    }
  };

  this.withoutMatchesIn = function(mainLabels) {
    return new RegularLabelsData(R.filter(hasNoMatch, list));

    function hasNoMatch(label) {
      return R.not(R.any(R.curry(R.flip(LabelsData.prototype.match))(label), mainLabels));
    }
  };
}


function MainLabelsData(list) {
  this.list = list;

  var matchesAnyRegularLabel = function(regularLabels, mainLabel) {
    return R.any(R.curry(LabelsData.prototype.match)(mainLabel), regularLabels);
  };

  this.checkForMatchingRegularLabel = function(regularLabels) {
    list.forEach(logIfNoMatchingRegularLabel);

    function logIfNoMatchingRegularLabel(mainLabel) {
      if (!matchesAnyRegularLabel(regularLabels, mainLabel)) {
        console.log('no matching regular label for "' + mainLabel.name + '"');
      }
    }
  };

  this.withMatchesIn = function(regularLabels) {
    return new MainLabelsData(R.filter(R.curry(matchesAnyRegularLabel)(regularLabels), list));
  };

  this.adoptUrlFromMatchingLabel = function(regularLabels) {
    return new MainLabelsData(R.map(adoptUrlFromMatchingRegularLabel, list));

    function adoptUrlFromMatchingRegularLabel(mainLabel) {
      return {
        name: mainLabel.name,
        url: matchingRegularLabel(mainLabel).url
      };
    }

    function matchingRegularLabel(mainLabel) {
      return R.find(R.curry(LabelsData.prototype.match)(mainLabel), regularLabels);
    }
  };
}


var RegularLabels = (function(list) {
  var sort = function(list) {
    return R.sortBy(R.compose(R.toLower, R.prop('name')), list);
  };

  function RegularLabels(list) {
    this.list = sort(list);
  }

  RegularLabels.prototype.toHtml = function(separator) {
    return R.compose(R.join(separatorToHtml()), R.map(labelToHtml))(this.list);

    function labelToHtml(label) {
      return label.toHtml();
    }

    function separatorToHtml() {
      return (separator === null) ? " " : new Separator(separator).toHtml();
    }
  };

  return RegularLabels;
}());


var MainLabels = (function(list) {
  var sort = function(list) {
    return R.concat(sortLabelsWithIndex(), sortLabelsWithoutIndex());

    function sortLabelsWithIndex() {
      return R.sortBy(R.prop('index'), labelsWithIndex());
    }

    function labelsWithIndex() {
      return R.filter(hasIndex, list);
    }

    function hasIndex(label) {
      return label.index !== null;
    }

    function sortLabelsWithoutIndex() {
      return R.sortBy(R.compose(R.toLower, R.prop('name')), labelsWithoutIndex());
    }

    function labelsWithoutIndex() {
      return R.difference(list, labelsWithIndex());
    }
  };

  function MainLabels(list) {
    this.list = sort(list);
  }

  MainLabels.prototype = Object.create(RegularLabels.prototype);
  MainLabels.prototype.constructor = MainLabels;

  return MainLabels;
}());


function Labels(list) {
  RegularLabels.call(this, list);
}

Labels.prototype = Object.create(RegularLabels.prototype);
Labels.prototype.constructor = Labels;

Labels.prototype.main = function() {
  return new MainLabels(R.filter(isMainLabel, this.list));

  function isMainLabel(label) {
    return label instanceof MainLabel;
  }
};


function RegularLabel(name, url) {
  this.name = tr(name);
  this.url = url;
}

RegularLabel.prototype.toHtml = function() {
  return "<a href='" + this.url + "' rel='tag' title='" + tr("View all posts in") + " " + this.name + "'>" + this.name + "</a>";
};


var MainLabel = (function(name, url) {
  var index = function(name) {
    var matches = /^\*.*\[(\d+)\]\*$/.exec(name);
    return (matches === null) ? null : matches[1];
  };

  function MainLabel(name, url) {
    this.index = index(name);
    RegularLabel.call(this, MainLabel.prototype.trim(name), url);
  }

  MainLabel.prototype = Object.create(RegularLabel.prototype);
  MainLabel.prototype.constructor = MainLabel;

  MainLabel.prototype.markedAsMainLabel = function(name) {
    return /^\*.*\*$/.test(name);
  };

  MainLabel.prototype.trim = function(name) {
    var matches = /^\*?\s*(.*?)\s*(\[\d+\])?\*?$/.exec(name);
    return matches[1];
  };

  return MainLabel;
}());


function Separator(character) {
  this.character = character;
}

Separator.prototype.toHtml = function() {
  return "<span class='separator'>" + this.character + "</span>";
};