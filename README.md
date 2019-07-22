# SBBS
Synchronet BBS JS
DupChk.js
Can be run from a terminal shell using jsexec dupchk -s <syspass> -<option>s where options are either -s <syspass> -e -a -n and -q
    -s <syspass> must be present ... syspass is the System Password as defined in SCFG -> SYSTEM -> PASSWORD
    -e starts by comparing Email Addresses
    -a starts by comparing Aliases
    -n starts by comparing Real Names
    -q turns off logging to /sbbs/data/logs (default is on)
  
DupChk.js can also be run from within SBBS anywhere by a User with a Security Level greater 89.
    From the command Shell EXEC ?DUPCHK  will invoke the dupchk.js script which, when run
    from the Command Shell, does not require the system password (since it is required to ;EXEC)
    and will default to comparing Email Addresses.
    
DupChk.js is intended to compare user accounts and report any duplicate user base entries
menus are provided to look up a users account in order to edit that account, switch between 
comparative types (ie Alias, Email or Real Name);

Any questions, comments or concerns, please contact Mortifis@alleycat.synchro.net or
send me a Dove-Net Synchronet.Sysops message.



